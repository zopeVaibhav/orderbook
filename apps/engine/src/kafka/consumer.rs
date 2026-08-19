use rdkafka::{
    ClientConfig, TopicPartitionList,
    consumer::{Consumer, StreamConsumer},
    message::BorrowedMessage,
};
use std::time::Duration;

pub struct KafkaConsumer {
    inner: StreamConsumer,
}

impl KafkaConsumer {
    pub fn new(brokers: &str, group_id: &str) -> anyhow::Result<Self> {
        let inner: StreamConsumer = ClientConfig::new()
            .set("bootstrap.servers", brokers)
            .set("group.id", group_id)
            .set("enable.auto.commit", "false")
            .create()?;

        Ok(Self { inner })
    }

    pub fn assign(&self, tpl: &TopicPartitionList) -> anyhow::Result<()> {
        self.inner.assign(tpl)?;
        Ok(())
    }

    pub async fn recv(&self) -> anyhow::Result<BorrowedMessage<'_>> {
        Ok(self.inner.recv().await?)
    }

    pub fn fetch_watermarks(
        &self,
        topic: &str,
        partition: i32,
        timeout: Duration,
    ) -> anyhow::Result<(i64, i64)> {
        Ok(self.inner.fetch_watermarks(topic, partition, timeout)?)
    }

    pub fn commit(&self, msg: &BorrowedMessage) -> anyhow::Result<()> {
        self.inner
            .commit_message(msg, rdkafka::consumer::CommitMode::Async)?;
        Ok(())
    }
}
