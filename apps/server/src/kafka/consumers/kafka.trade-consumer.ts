import { Consumer } from 'kafkajs';
import chalk from 'chalk';
import { KafkaClient } from '../kafka.client';
import { KafkaTopics, type TradeOut } from '@repo/types/kafka';
import { ENV } from '../../configs/env.config';
import { handleTrade } from '../handlers/handler.trade';

export default class TradeConsumer {
    static #consumer: Consumer | null = null;

    static async start() {
        const consumer = KafkaClient.instance.consumer({
            groupId: `${ENV.KAFKA_GROUP_ID}-trade`,
        });
        this.#consumer = consumer;

        await consumer.connect();
        await consumer.subscribe({ topic: KafkaTopics.TRADES_OUT, fromBeginning: false });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                if (!message.value) return;

                try {
                    await handleTrade(JSON.parse(message.value.toString()) as TradeOut);
                } catch (error) {
                    console.error(
                        chalk.red(`${topic}[${partition}] trade handling failed:`),
                        error,
                    );
                }
            },
        });

        console.log(chalk.green('trade consumer started'));
    }

    static async stop() {
        if (!this.#consumer) return;
        await this.#consumer.disconnect();
        this.#consumer = null;
    }
}
