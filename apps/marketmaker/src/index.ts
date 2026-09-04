import chalk from 'chalk';
import { prisma } from '@repo/database';
import { parseEnv } from './config/env.config';
import { REGISTRY_POLL_MS, SEED_PRICES } from './config/bots.config';
import OrderProducer from './orders/producer';
import { MarketMaker } from './runtime/maker';
import { Taker } from './runtime/taker';
import type { MarketSpec } from './quotes/ladder';

parseEnv();

const makers = new Map<string, MarketMaker>();
const takers = new Map<string, Taker>();
let bots: string[] = [];
let shuttingDown = false;

async function loadBots(): Promise<string[]> {
    const rows = await prisma.user.findMany({ where: { isBot: true }, select: { id: true } });
    return rows.map((row) => row.id);
}

async function sync(): Promise<void> {
    if (shuttingDown) return;

    const markets = await prisma.markets.findMany({
        where: { status: 'ACTIVE', makerEnabled: true },
        select: {
            id: true,
            base: true,
            quote: true,
            tickExp: true,
            lotExp: true,
            minQuantity: true,
        },
    });

    const wanted = new Set(markets.map((market) => market.id));

    for (const [id, maker] of makers) {
        if (wanted.has(id)) continue;
        takers.get(id)?.stop();
        takers.delete(id);
        await maker.stop();
        makers.delete(id);
        console.log(chalk.yellow(`maker off ${id}`));
    }

    for (const market of markets) {
        if (makers.has(market.id)) continue;

        const anchor = SEED_PRICES[market.base];
        if (anchor === undefined) {
            console.warn(chalk.yellow(`no seed price for ${market.base}, skipping`));
            continue;
        }

        const maker = new MarketMaker(market as MarketSpec, bots, Number(anchor));
        makers.set(market.id, maker);
        await maker.start();

        const taker = new Taker(market as MarketSpec, bots, maker);
        takers.set(market.id, taker);
        taker.start();

        console.log(chalk.green(`maker on ${market.base}/${market.quote}`));
    }
}

async function shutdown(reason: string) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(chalk.yellow(`marketmaker shutting down: ${reason}`));

    for (const taker of takers.values()) taker.stop();
    for (const maker of makers.values()) await maker.stop();

    await OrderProducer.disconnect();
    await prisma.$disconnect();
    process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

async function main() {
    bots = await loadBots();

    if (bots.length === 0) {
        console.error(chalk.red('no bot accounts: run `bun run --filter marketmaker seed-bots`'));
        process.exit(1);
    }

    await OrderProducer.connect();
    await sync();

    setInterval(() => void sync(), REGISTRY_POLL_MS);

    console.log(chalk.green(`marketmaker ready, ${bots.length} bots, ${makers.size} markets on`));
}

main().catch((error) => {
    console.error(chalk.red('marketmaker crashed:'), error);
    process.exit(1);
});
