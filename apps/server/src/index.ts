import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';
import appRoutes from './routers/v1/router.v1';
import { ENV, parseEnv } from './configs/env.config';
import OrderProducer from './kafka/kafka.order-producer';
import EngineConsumer from './kafka/kafka.consumer';

parseEnv();

const app = express();

app.use(
    cors({
        origin: ENV.WEB_ORIGIN,
        credentials: true,
    }),
);
app.use(express.json());
app.use(cookieParser());

app.use('/api/v1', appRoutes);

app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

await OrderProducer.connect();
await EngineConsumer.start();

const server = app.listen(ENV.SERVER_PORT, () => {
    console.log(`Server is running on port: ${ENV.SERVER_PORT}`);
});

const shutdown = (signal: string) => {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    // Stop accepting requests first, then flush the producer so orders already
    // accepted still reach kafka.
    server.close(async (err) => {
        if (err) console.error('Error during shutdown:', err);
        else console.log('Server closed.');

        try {
            await OrderProducer.disconnect();
        } catch (error) {
            console.error('Producer disconnect failed:', error);
        }

        try {
            await EngineConsumer.stop();
        } catch (error) {
            console.error('Consumer disconnect failed:', error);
        }

        process.exit(err ? 1 : 0);
    });

    setTimeout(() => {
        console.error('Forced shutdown after 10s timeout.');
        process.exit(1);
    }, 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
