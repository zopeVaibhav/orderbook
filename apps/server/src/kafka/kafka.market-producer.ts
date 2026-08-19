import { Producer } from 'kafkajs';
import { KafkaClient } from './kafka.client';
import { KafkaTopics, MarketControlEvent, MarketRegistered } from '@repo/types';

export default class MarketProducer {
    static #producer: Producer | null = null;

    static async connect() {
        this.#producer = KafkaClient.instance.producer({ allowAutoTopicCreation: false });
        await this.#producer.connect();
    }

    static async disconnect() {
        if (this.#producer) {
            await this.#producer.disconnect();
            this.#producer = null;
        }
    }

    static async #send(msg: MarketControlEvent) {
        if (!this.#producer) throw new Error('Producer not connected');
        await this.#producer.send({
            topic: KafkaTopics.MARKET_CONTROL,
            messages: [{ key: msg.market_id, value: JSON.stringify(msg) }],
        });
    }

    static async publishNewMarket(msg: MarketRegistered) {
        await this.#send({ type: 'market_registered', ...msg });
    }
}
