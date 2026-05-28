import { Kafka } from 'kafkajs';
import { ENV } from './config/env.config';

const kafka = new Kafka({
    clientId: 'settlement-service',
    brokers: [`${ENV.KAFKA_BROKER}`],
});

const consumer = kafka.consumer({
    groupId: 'settlement-group',
});

async function main() {
    await consumer.connect();

    await consumer.subscribe({
        topic: 'trades.out',
        fromBeginning: true,
    });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log('topic: ', topic);
            console.log('partition', partition);
            console.log('message: ', message?.value?.toString());
        },
    });
}

main().catch(console.error);
