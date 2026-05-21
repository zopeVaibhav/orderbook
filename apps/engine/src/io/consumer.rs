use rdkafka::{
    ClientConfig,
    consumer::{Consumer, StreamConsumer},
    message::BorrowedMessage,
};

pub struct OrderConsumer {
    inner: StreamConsumer,
}

impl OrderConsumer {
    pub fn new(brokers: &str, group_id: &str, topics: &[&str]) -> anyhow::Result<Self> {
        let inner: StreamConsumer = ClientConfig::new()
            .set("bootstrap.servers", brokers)
            .set("group.id", group_id)
            .set("enable.auto.commit", "false")
            .create()?;

        inner.subscribe(topics)?;

        Ok(Self { inner })
    }

    pub async fn recv(&self) -> anyhow::Result<BorrowedMessage<'_>> {
        Ok(self.inner.recv().await?)
    }
}

