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
        let key = event.key();
        let topic = event.topic();
        let payload = serde_json::to_string(event)?;

        let mut delay_ms = 100;
        loop {
            let result = self
                .inner
                .send(
                    FutureRecord::to(topic).key(key).payload(&payload),
                    Duration::from_secs(0),
                )
                .await;

            match result {
                Ok(_) => return Ok(()),
                Err((e, _)) => {
                    eprintln!("send event failed: {}, retrying in {}ms", e, delay_ms);
                    tokio::time::sleep(Duration::from_millis(delay_ms)).await;
                    delay_ms = (delay_ms * 2).min(5000);
                }
            }
        }
    }
}
