use crate::protocol::OutgoingEvent;
use rdkafka::{
    ClientConfig,
    producer::{FutureProducer, FutureRecord},
};
use std::time::Duration;

const MAX_SEND_ATTEMPTS: u32 = 10;
const INITIAL_BACKOFF_MS: u64 = 100;
const MAX_BACKOFF_MS: u64 = 5_000;

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

        let mut delay_ms = INITIAL_BACKOFF_MS;
        let mut last_err: Option<rdkafka::error::KafkaError> = None;

        for attempt in 1..=MAX_SEND_ATTEMPTS {
            let result = self
                .inner
                .send(
                    FutureRecord::to(topic).key(key).payload(&payload),
                    Duration::from_secs(5),
                )
                .await;

            match result {
                Ok(_) => return Ok(()),
                Err((e, _)) => {
                    eprintln!(
                        "send event failed (attempt {}/{}): {}, retrying in {}ms",
                        attempt, MAX_SEND_ATTEMPTS, e, delay_ms
                    );
                    last_err = Some(e);
                    if attempt == MAX_SEND_ATTEMPTS {
                        break;
                    }
                    tokio::time::sleep(Duration::from_millis(delay_ms)).await;
                    delay_ms = (delay_ms * 2).min(MAX_BACKOFF_MS);
                }
            }
        }

        Err(anyhow::anyhow!(
            "send_event to topic '{}' exhausted {} attempts: {:?}",
            topic,
            MAX_SEND_ATTEMPTS,
            last_err
        ))
    }
}
