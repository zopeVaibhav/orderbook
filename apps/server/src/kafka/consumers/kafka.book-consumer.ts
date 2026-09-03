import { randomUUID } from 'node:crypto';
import { Consumer } from 'kafkajs';
import chalk from 'chalk';
import { KafkaClient } from '../kafka.client';
import { KafkaTopics, type BookDelta } from '@repo/types/kafka';
import { ENV } from '../../configs/env.config';
import { handleBookDelta } from '../handlers/handler.book';

export default class BookConsumer {
    static #consumer: Consumer | null = null;

    static async start() {
        const consumer = KafkaClient.instance.consumer({
            groupId: `${ENV.KAFKA_GROUP_ID}-book-${randomUUID()}`,
        });
        this.#consumer = consumer;

        await consumer.connect();
        await consumer.subscribe({ topic: KafkaTopics.BOOK_DELTA, fromBeginning: true });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                if (!message.value) return;

                try {
                    await handleBookDelta(JSON.parse(message.value.toString()) as BookDelta);
                } catch (error) {
                    console.error(chalk.red(`${topic}[${partition}] book delta failed:`), error);
                }
            },
        });

        console.log(chalk.green('book projection consumer started'));
    }

    static async stop() {
        if (!this.#consumer) return;
        await this.#consumer.disconnect();
        this.#consumer = null;
    }
}
