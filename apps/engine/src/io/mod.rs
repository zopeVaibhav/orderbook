use crate::{
    io::{consumer::OrderConsumer, producer::OrderProducer, wire::IncomingOrder},
    types::{engine::Engine, market::Market},
};
use rdkafka::Message;

pub mod consumer;
pub mod producer;
pub mod wire;

pub async fn run() -> anyhow::Result<()> {
    let consumer = OrderConsumer::new("localhost:9092", "engine", &["orders.in"])?;
    let producer = OrderProducer::new("localhost:9092")?;
    let mut engine = Engine::default();

    engine.add_market(
        "SOL/USDC".into(),
        Market {
            tick_exp: 2,
            lot_exp: 6,
            min_quantity: 1000,
        },
    );

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
                let market_id = new_order_payload.market_id.clone();
                let outcome = engine.submit_new_order(new_order_payload);
            }
            IncomingOrder::CancelOrder(cancel_order_payload) => {
                let outcome = engine.submit_cancel(cancel_order_payload);
            }
        }
    }
}
