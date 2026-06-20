import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';
import appRoutes from './routers/v1/router.v1';
import { ENV, parseEnv } from './configs/env';

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

const server = app.listen(ENV.SERVER_PORT, () => {
    console.log(`Server is running on port: ${ENV.SERVER_PORT}`);
});

const shutdown = (signal: string) => {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    server.close((err) => {
        if (err) {
            console.error('Error during shutdown:', err);
            process.exit(1);
        }
        console.log('Server closed.');
        process.exit(0);
    });

    setTimeout(() => {
        console.error('Forced shutdown after 10s timeout.');
        process.exit(1);
    }, 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
