use crate::{
    io::{
        consumer::OrderConsumer, incoming::IncomingOrder, outgoing::OutgoingEvent,
        producer::OrderProducer, snapshot::SnapshotWriter,
    },
    types::{engine::Engine, market::Market},
};
use dotenvy::dotenv;
use rdkafka::Message;
use std::env;

pub mod consumer;
pub mod incoming;
pub mod outgoing;
pub mod producer;
pub mod snapshot;

pub async fn run() -> anyhow::Result<()> {
    dotenv().ok();

    let brokers = env::var("KAFKA_BROKERS").unwrap_or("localhost:9092".into());
    let group_id = env::var("KAFKA_GROUP_ID").unwrap_or("engine".into());

    let consumer = OrderConsumer::new(&brokers, &group_id, &["orders.in"])?;
    let producer = OrderProducer::new(&brokers)?;

    let mut engine = Engine::default();
    let mut snapshot_writer = SnapshotWriter::new()?;

    let markets = SnapshotWriter::load_all()?;
    for (market_id, snapshot) in markets {
        let next_offset = snapshot.market_state.last_applied_seq + 1;
        engine.markets.insert(market_id, snapshot.market_state);
        consumer.seek("orders.in", snapshot.partition, next_offset)?;
    }

    if engine.markets.is_empty() {
        engine.add_market(
            "SOL/USDC".into(),
            Market {
                tick_exp: 2,
                lot_exp: 6,
                min_quantity: 1000,
            },
        );
    }

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

        match order_type {
            IncomingOrder::NewOrder(new_order_payload) => {
                let outcome = engine.submit_new_order(&new_order_payload);
                let events =
                    OutgoingEvent::new_order_events(outcome, &new_order_payload, now_ms(), seq);

                for e in events {
                    producer.send_event(&e).await?;
                }
                engine.mark_applied(&new_order_payload.market_id, seq);

                if seq > 0 && seq % 10000 == 0 {
                    let state = engine
                        .markets
                        .get(&new_order_payload.market_id)
                        .ok_or_else(|| anyhow::anyhow!("Unknown market"))?;

                    snapshot_writer.take_snapshot(
                        &new_order_payload.market_id,
                        state,
                        msg.partition(),
                    )?;
                }

                consumer.commit(&msg)?
            }
            IncomingOrder::CancelOrder(cancel_order_payload) => {
                let outcome = engine.submit_cancel(&cancel_order_payload);
                let events = OutgoingEvent::cancel_order_events(
                    outcome,
                    &cancel_order_payload,
                    now_ms(),
                    seq,
                );

                for e in events {
                    producer.send_event(&e).await?;
                }
                engine.mark_applied(&cancel_order_payload.market_id, seq);

                if seq > 0 && seq % 10000 == 0 {
                    let state = engine
                        .markets
                        .get(&cancel_order_payload.market_id)
                        .ok_or_else(|| anyhow::anyhow!("Unknown market"))?;

                    snapshot_writer.take_snapshot(
                        &cancel_order_payload.market_id,
                        state,
                        msg.partition(),
                    )?;
                }

                consumer.commit(&msg)?
            }
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
