import { Kafka } from 'kafkajs';
import { ENV } from '../configs/env.config';

export class KafkaClient {
    static #kafka: Kafka | null = null;

    static get instance() {
        if (!KafkaClient.#kafka) {
            KafkaClient.#kafka = new Kafka({
                clientId: 'server',
                brokers: [ENV.KAFKA_BROKER],
            });
        }
        return KafkaClient.#kafka;
    }
}
