import { Consumer } from 'kafkajs';
import chalk from 'chalk';
import { KafkaClient } from '../kafka.client';
import { KafkaTopics, type OrderAck } from '@repo/types/kafka';
import { ENV } from '../../configs/env.config';
import { handleAck } from '../handlers/handler.ack';

export default class EngineConsumer {
    static #consumer: Consumer | null = null;

    static async start() {
        const consumer = KafkaClient.instance.consumer({ groupId: ENV.KAFKA_GROUP_ID });
        this.#consumer = consumer;

        await consumer.connect();
        await consumer.subscribe({ topic: KafkaTopics.ORDERS_ACK, fromBeginning: false });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                if (!message.value) return;

                try {
                    await handleAck(JSON.parse(message.value.toString()) as OrderAck);
                } catch (error) {
                    console.error(chalk.red(`${topic}[${partition}] handling failed:`), error);
                }
            },
        });
    }

    static async stop() {
        if (!this.#consumer) return;
        await this.#consumer.disconnect();
        this.#consumer = null;
    }
}
