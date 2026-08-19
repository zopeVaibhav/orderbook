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

let shuttingDown = false;

async function shutdown(reason: string) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(chalk.yellow(`settlement service shutting down: ${reason}`));
    try {
        await consumer.disconnect();
    } catch (err) {
        console.error(chalk.red('consumer disconnect failed:'), err);
    }
    process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

async function main() {
    await consumer.connect();

    await consumer.subscribe({
        topic: 'trades.out',
        fromBeginning: true,
    });

    await consumer.run({
        autoCommit: false,
        eachMessage: async ({ topic, partition, message }) => {
            const raw = message.value?.toString();
            if (!raw) {
                await commit(topic, partition, message.offset);
                return;
            }

            let parsed;
            try {
                parsed = tradeOutSchema.parse(JSON.parse(raw));
            } catch (err) {
                console.error(
                    chalk.red(
                        `poison message skipped at ${topic}[${partition}]@${message.offset}:`,
                    ),
                    err,
                );
                await commit(topic, partition, message.offset);
                return;
            }

            await settleTrade(parsed);
            await commit(topic, partition, message.offset);
        },
    });

    console.log(chalk.green('settlement service listening on trades.out'));
}

async function commit(topic: string, partition: number, offset: string) {
    await consumer.commitOffsets([{ topic, partition, offset: (BigInt(offset) + 1n).toString() }]);
}

main().catch((error) => {
    console.error(chalk.red('settlement service crashed:'), error);
    process.exit(1);
});
