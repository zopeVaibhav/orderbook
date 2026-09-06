use crate::{
    engine::{Engine, Market, MarketId},
    kafka::{KafkaConsumer, KafkaProducer},
    persistence::SnapshotWriter,
    protocol::{IncomingOrder, MarketControlEvent, OutgoingEvent},
};
use dotenvy::dotenv;
use rdkafka::{Message, Offset, TopicPartitionList};
use std::{collections::HashMap, env, time::Duration};

const DEFAULT_SNAPSHOT_INTERVAL: i64 = 10_000;
const ORDERS_TOPIC: &str = "orders.in";
const MARKET_CONTROL_TOPIC: &str = "markets.control";
const CONTROL_DRAIN_TIMEOUT_SECS: u64 = 10;

const UNKNOWN_MARKET_SCALE: Market = Market {
    tick_exp: 0,
    lot_exp: 0,
    min_quantity: 0,
};

pub async fn run() -> anyhow::Result<()> {
    dotenv().ok();

    let brokers = env::var("KAFKA_BROKER").unwrap_or("localhost:9092".into());
    let group_id = env::var("KAFKA_GROUP_ID").unwrap_or("engine".into());
    let market_control_group_id =
        env::var("KAFKA_MARKET_CONTROL_GROUP_ID").unwrap_or("engine_control".into());

    let order_consumer = KafkaConsumer::new(&brokers, &group_id)?;
    let ctrl_consumer = KafkaConsumer::new(&brokers, &market_control_group_id)?;
    let producer = KafkaProducer::new(&brokers)?;

    let mut engine = Engine::default();
    let mut snapshot_writer = SnapshotWriter::new()?;

    // The production cadence is unreachable in development, where a few orders
    // would never trigger a snapshot and every boot replays from zero.
    let snapshot_interval = env::var("SNAPSHOT_INTERVAL")
        .ok()
        .and_then(|v| v.parse::<i64>().ok())
        .filter(|v| *v > 0)
        .unwrap_or(DEFAULT_SNAPSHOT_INTERVAL);

    // Snapshots record the partition they came from, so it is tracked per market.
    let mut market_partitions: HashMap<MarketId, i32> = HashMap::new();

    /*
       PHASE 1 — rehydrate markets from snapshots. Each snapshot carries the
       partition it was taken from plus the last offset already applied.
    */

    let mut resume_offsets: HashMap<i32, i64> = HashMap::new();
    for (market_id, snapshot) in SnapshotWriter::load_all()? {
        let next_offset = snapshot.market_state.last_applied_seq + 1;
        let partition = snapshot.partition;
        println!(
            "Restored market {} from snapshot, resuming {} partition {} at offset {}",
            market_id, ORDERS_TOPIC, partition, next_offset
        );
        market_partitions.insert(market_id.clone(), partition);
        engine.markets.insert(market_id, snapshot.market_state);
        resume_offsets
            .entry(partition)
            .and_modify(|o| *o = (*o).min(next_offset))
            .or_insert(next_offset);
    }

    let mut order_tpl = TopicPartitionList::new();
    for (partition, next_offset) in &resume_offsets {
        order_tpl.add_partition_offset(ORDERS_TOPIC, *partition, Offset::Offset(*next_offset))?;
    }

    /*
       PHASE 2 — drain markets.control to its high watermark so every market the
       server has registered is known before the first order is matched.
    */

    let mut ctrl_tpl = TopicPartitionList::new();
    ctrl_tpl.add_partition_offset(MARKET_CONTROL_TOPIC, 0, Offset::Beginning)?;
    ctrl_consumer.assign(&ctrl_tpl)?;
    println!("Draining {}", MARKET_CONTROL_TOPIC);
    drain_market_control(&ctrl_consumer, &mut engine).await?;
    println!("Registry holds {} markets", engine.markets.len());

    /*
       PHASE 3 — assign orders.in now the registry is populated. A fresh boot has
       no snapshots, so fall back to partition 0 from the beginning.
    */

    if order_tpl.count() == 0 {
        order_tpl.add_partition_offset(ORDERS_TOPIC, 0, Offset::Beginning)?;
    }
    order_consumer.assign(&order_tpl)?;
    println!("Listening on {} and {}", ORDERS_TOPIC, MARKET_CONTROL_TOPIC);

    /*
       PHASE 4 — steady state. Both topics stay live: control keeps the registry
       current while orders are matched.
    */

    loop {
        let msg = tokio::select! {
            _ = tokio::signal::ctrl_c() => {
                shutdown(&mut snapshot_writer, &engine, &market_partitions).await;
                return Ok(());
            }
            ctrl = ctrl_consumer.recv() => {
                apply_market_control(&mut engine, ctrl?.payload());
                continue;
            }
            order = order_consumer.recv() => order?,
        };

        let bytes = msg
            .payload()
            .ok_or_else(|| anyhow::anyhow!("empty payload"))?;
        let seq = msg.offset();

        let order_type = match serde_json::from_slice::<IncomingOrder>(bytes) {
            Ok(v) => v,
            Err(e) => {
                eprintln!("Warn parse failed at offset {} , {}", seq, e);
                continue;
            }
        };

        let target_market = match &order_type {
            IncomingOrder::NewOrder(payload) => &payload.market_id,
            IncomingOrder::CancelOrder(payload) => &payload.market_id,
        };

        if engine
            .markets
            .get(target_market)
            .is_some_and(|state| seq <= state.last_applied_seq)
        {
            continue;
        }

        let (market_id, events) = match order_type {
            IncomingOrder::NewOrder(new_order_payload) => {
                let outcome = engine.submit_new_order(&new_order_payload);
                let market = engine
                    .markets
                    .get(&new_order_payload.market_id)
                    .map(|state| state.market.clone())
                    .unwrap_or(UNKNOWN_MARKET_SCALE);

                let events = OutgoingEvent::new_order_events(
                    outcome,
                    &new_order_payload,
                    &market,
                    now_ms(),
                    seq,
                );
                (new_order_payload.market_id, events)
            }
            IncomingOrder::CancelOrder(cancel_order_payload) => {
                let outcome = engine.submit_cancel(&cancel_order_payload);
                let market = engine
                    .markets
                    .get(&cancel_order_payload.market_id)
                    .map(|state| state.market.clone())
                    .unwrap_or(UNKNOWN_MARKET_SCALE);

                let events = OutgoingEvent::cancel_order_events(
                    outcome,
                    &cancel_order_payload,
                    &market,
                    now_ms(),
                    seq,
                );
                (cancel_order_payload.market_id, events)
            }
        };

        for e in events {
            producer.send_event(&e).await?;
        }

        engine.mark_applied(&market_id, seq);
        market_partitions.insert(market_id.clone(), msg.partition());

        if seq > 0
            && seq % snapshot_interval == 0
            && let Some(state) = engine.markets.get(&market_id)
        {
            snapshot_writer.take_snapshot(&market_id, state, msg.partition())?;
        }

        order_consumer.commit(&msg)?
    }
}

/**
 * Without this the book dies with the process, and the next boot replays every
 * order ever published to rebuild it.
 */
async fn shutdown(
    snapshot_writer: &mut SnapshotWriter,
    engine: &Engine,
    market_partitions: &HashMap<MarketId, i32>,
) {
    println!(
        "\nShutting down, snapshotting {} markets",
        market_partitions.len()
    );
    snapshot_writer.flush().await;

    for (market_id, partition) in market_partitions {
        let Some(state) = engine.markets.get(market_id) else {
            continue;
        };
        if let Err(e) = snapshot_writer.take_snapshot_now(market_id, state, *partition) {
            eprintln!("snapshot on shutdown failed for {market_id}: {e}");
        }
    }
}

async fn drain_market_control(consumer: &KafkaConsumer, engine: &mut Engine) -> anyhow::Result<()> {
    let timeout = Duration::from_secs(CONTROL_DRAIN_TIMEOUT_SECS);

    let (low, high) = match consumer.fetch_watermarks(MARKET_CONTROL_TOPIC, 0, timeout) {
        Ok(watermarks) => watermarks,
        Err(e) => {
            eprintln!(
                "Warn watermarks for {} unavailable, skipping boot drain: {}",
                MARKET_CONTROL_TOPIC, e
            );
            return Ok(());
        }
    };

    if low >= high {
        println!("{} is empty, no markets to register", MARKET_CONTROL_TOPIC);
        return Ok(());
    }

    loop {
        let msg = tokio::time::timeout(timeout, consumer.recv())
            .await
            .map_err(|_| anyhow::anyhow!("timed out draining {}", MARKET_CONTROL_TOPIC))??;

        apply_market_control(engine, msg.payload());

        if msg.offset() + 1 >= high {
            return Ok(());
        }
    }
}

fn apply_market_control(engine: &mut Engine, payload: Option<&[u8]>) {
    let Some(bytes) = payload else {
        eprintln!("Warn market control message has empty payload");
        return;
    };

    let event = match serde_json::from_slice::<MarketControlEvent>(bytes) {
        Ok(v) => v,
        Err(e) => {
            eprintln!("Warn market control parse failed: {}", e);
            return;
        }
    };

    match event {
        MarketControlEvent::MarketRegistered(payload) => {
            let market_id: MarketId = payload.market_id.into();
            if engine.markets.contains_key(&market_id) {
                return;
            }

            let min_quantity = match payload.min_quantity.parse::<u64>() {
                Ok(v) => v,
                Err(e) => {
                    eprintln!(
                        "Warn market {} has unparseable min_quantity {}: {}",
                        market_id, payload.min_quantity, e
                    );
                    return;
                }
            };

            println!(
                "Registered market {} tick_exp={} lot_exp={} min_quantity={}",
                market_id, payload.tick_exp, payload.lot_exp, min_quantity
            );

            engine.add_market(
                market_id,
                Market {
                    tick_exp: payload.tick_exp,
                    lot_exp: payload.lot_exp,
                    min_quantity,
                },
            );
        }
    }
}

fn now_ms() -> u64 {
    use ::std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}
