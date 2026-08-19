import z from 'zod';
import chalk from 'chalk';
import { config } from 'dotenv';
import path from 'node:path';

config({ path: path.resolve(__dirname, '../../../../.env') });

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    SERVER_PORT: z.coerce.number().default(8080),
    WEB_ORIGIN: z.url().default('http://localhost:3000'),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    ACCESS_TOKEN_TTL_SEC: z.coerce.number().default(900),
    REFRESH_TOKEN_TTL_SEC: z.coerce.number().default(604800),
    GOOGLE_CLIENT_ID: z.string(),
    KAFKA_BROKER: z.string(),
    KAFKA_GROUP_ID: z.string(),
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
