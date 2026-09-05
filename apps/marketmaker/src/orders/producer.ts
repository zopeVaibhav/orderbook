import { Kafka, Producer } from 'kafkajs';
import { CancelOrderPayload, IncomingOrder, KafkaTopics, NewOrderPayload } from '@repo/types/kafka';
import { ENV } from '../config/env.config';

export default class OrderProducer {
    static #producer: Producer | null = null;

    static async connect() {
        const kafka = new Kafka({ clientId: 'marketmaker', brokers: [ENV.KAFKA_BROKER] });
        this.#producer = kafka.producer({ allowAutoTopicCreation: false });
        await this.#producer.connect();
    }

    static async disconnect() {
        if (!this.#producer) return;
        await this.#producer.disconnect();
        this.#producer = null;
    }

    static async #send(msg: IncomingOrder) {
        if (!this.#producer) throw new Error('Producer not connected');
        await this.#producer.send({
            topic: KafkaTopics.ORDERS_IN,
            messages: [{ key: msg.market_id, value: JSON.stringify(msg) }],
        });
    }

    static async publishNewOrder(order: NewOrderPayload) {
        await this.#send({ type: 'new_order', ...order });
    }

    static async publishCancelOrder(order: CancelOrderPayload) {
        await this.#send({ type: 'cancel_order', ...order });
    }
}
