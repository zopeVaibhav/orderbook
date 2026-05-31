import { Kafka } from 'kafkajs';
import chalk from 'chalk';
import { ENV, parseEnv } from './config/env.config';
import { settleTrade } from './settle';
import { tradeOutSchema } from './schema/trade.schema';

parseEnv();

const kafka = new Kafka({
    clientId: 'settlement-service',
    brokers: [ENV.KAFKA_BROKER],
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
        eachMessage: async ({ message }) => {
            const raw = message.value?.toString();
            if (!raw) return;

            const trade = tradeOutSchema.parse(JSON.parse(raw));
            await settleTrade(trade);
        },
    });

    console.log(chalk.green('settlement service listening on trades.out'));
}

main().catch((error) => {
    console.error(chalk.red('settlement service crashed:'), error);
    process.exit(1);
});
