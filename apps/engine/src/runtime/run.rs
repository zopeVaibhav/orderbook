use crate::{
    engine::{Engine, Market},
    kafka::{OrderConsumer, OrderProducer},
    persistence::SnapshotWriter,
    protocol::{IncomingOrder, OutgoingEvent},
};
use dotenvy::dotenv;
use rdkafka::{Message, Offset, TopicPartitionList};
use std::env;

const SNAPSHOT_INTERVAL: i64 = 10_000;
const ORDERS_TOPIC: &str = "orders.in";

pub async fn run() -> anyhow::Result<()> {
    dotenv().ok();

    let brokers = env::var("KAFKA_BROKERS").unwrap_or("localhost:9092".into());
    let group_id = env::var("KAFKA_GROUP_ID").unwrap_or("engine".into());

    let consumer = OrderConsumer::new(&brokers, &group_id)?;
    let producer = OrderProducer::new(&brokers)?;

    let mut engine = Engine::default();
    let mut snapshot_writer = SnapshotWriter::new()?;

    let markets = SnapshotWriter::load_all()?;
    let mut tpl = TopicPartitionList::new();

    if markets.is_empty() {
        engine.add_market(
            "SOL/USDC".into(),
            Market {
                tick_exp: 2,
                lot_exp: 6,
                min_quantity: 1000,
            },
        );
        tpl.add_partition_offset(ORDERS_TOPIC, 0, Offset::Beginning)?;
    } else {
        for (market_id, snapshot) in markets {
            let next_offset = snapshot.market_state.last_applied_seq + 1;
            let partition = snapshot.partition;
            engine.markets.insert(market_id, snapshot.market_state);
            tpl.add_partition_offset(ORDERS_TOPIC, partition, Offset::Offset(next_offset))?;
        }
    }

    consumer.assign(&tpl)?;

    loop {
        let msg = consumer.recv().await?;
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

        let (market_id, events) = match order_type {
            IncomingOrder::NewOrder(new_order_payload) => {
                let outcome = engine.submit_new_order(&new_order_payload);
                let market_state = engine
                    .markets
                    .get(&new_order_payload.market_id)
                    .ok_or_else(|| anyhow::anyhow!("Unknown Market"))?;

                let events = OutgoingEvent::new_order_events(
                    outcome,
                    &new_order_payload,
                    &market_state.market,
                    now_ms(),
                    seq,
                );
                (new_order_payload.market_id, events)
            }
            IncomingOrder::CancelOrder(cancel_order_payload) => {
                let outcome = engine.submit_cancel(&cancel_order_payload);
                let market_state = engine
                    .markets
                    .get(&cancel_order_payload.market_id)
                    .ok_or_else(|| anyhow::anyhow!("Unknown Market"))?;

                let events = OutgoingEvent::cancel_order_events(
                    outcome,
                    &cancel_order_payload,
                    &market_state.market,
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

        if seq > 0 && seq % SNAPSHOT_INTERVAL == 0 {
            let state = engine
                .markets
                .get(&market_id)
                .ok_or_else(|| anyhow::anyhow!("Unknown market"))?;

            snapshot_writer.take_snapshot(&market_id, state, msg.partition())?;
        }

        consumer.commit(&msg)?
    }
}

fn now_ms() -> u64 {
    use ::std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}
