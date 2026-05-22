use rdkafka::{
    ClientConfig,
    producer::{FutureProducer, FutureRecord},
};
use std::time::Duration;

use crate::io::outgoing::OutgoingEvent;

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

    pub async fn send_event(&self, event: &OutgoingEvent) -> anyhow::Result<()> {
        let payload = serde_json::to_string(event)?;
        self.inner
            .send(
                FutureRecord::to(event.topic())
                    .key(event.key())
                    .payload(&payload),
                Duration::from_secs(0),
            )
            .await
            .map_err(|(e, _)| anyhow::Error::from(e))?;
        Ok(())
    }
}
