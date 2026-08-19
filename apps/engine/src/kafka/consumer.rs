use rdkafka::{
    ClientConfig, TopicPartitionList,
    consumer::{Consumer, StreamConsumer},
    message::BorrowedMessage,
};

pub struct OrderConsumer {
    inner: StreamConsumer,
}

impl OrderConsumer {
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

    pub fn commit(&self, msg: &BorrowedMessage) -> anyhow::Result<()> {
        self.inner
            .commit_message(msg, rdkafka::consumer::CommitMode::Async)?;
        Ok(())
    }
}
