import { Producer } from 'kafkajs';
import { KafkaClient } from '../kafka.client';
import { CancelOrderPayload, IncomingOrder, KafkaTopics, NewOrderPayload } from '@repo/types/kafka';

export default class OrderProducer {
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
