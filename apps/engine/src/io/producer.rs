use rdkafka::{
    ClientConfig,
    producer::{FutureProducer, FutureRecord},
};
use std::time::Duration;

pub struct OrderProducer {
    inner: FutureProducer,
}

impl OrderProducer {
    pub fn new(brokers: &str) -> anyhow::Result<Self> {
        let inner: FutureProducer = ClientConfig::new()
            .set("bootstrap.servers", brokers)
            .set("acks", "all")
            .set("enable.idempotence", "true")
            .set("linger.ms", "0")
            .create()?;

        Ok(Self { inner })
    }

    async fn send_json(&self, topic: &str, key: &str, payload: &str) -> anyhow::Result<()> {
        self.inner
            .send(
                FutureRecord::to(topic).key(key).payload(payload),
                Duration::from_secs(0),
            )
            .await
            .map_err(|(e, _)| anyhow::Error::from(e))?;
        Ok(())
    }
    pub async fn emit_ack(&self, market_id: &str, json: &str) -> anyhow::Result<()> {
        self.send_json("orders.ack", market_id, json).await
    }

    pub async fn emit_trade_out(&self, market_id: &str, json: &str) -> anyhow::Result<()> {
        self.send_json("trades.out", market_id, json).await
    }

    pub async fn emit_book_delta(&self, market_id: &str, json: &str) -> anyhow::Result<()> {
        self.send_json("book.delta", market_id, json).await
    }
}
