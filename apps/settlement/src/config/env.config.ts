import z from 'zod';
import chalk from 'chalk';
import { config } from 'dotenv';
import path from 'node:path';

config({ path: path.resolve(__dirname, '../../../../.env') });

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    KAFKA_BROKER: z.url().default('localhost:9092'),
});

export let ENV: z.infer<typeof envSchema>;

export function parseEnv() {
    try {
        ENV = envSchema.parse(process.env);
    } catch (error) {
        console.error(
            chalk.dim(`\nCheck your .env file (see .env.example for required vars). ${error}\n`),
        );
        process.exit(1);
    }
}
