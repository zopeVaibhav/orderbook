import { randomUUID } from 'node:crypto';
import { prisma } from '../src/prisma';

const ASSETS: Array<{ symbol: string; name: string; decimals: number }> = [
    { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
    { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
    { symbol: 'SOL', name: 'Solana', decimals: 9 },
    { symbol: 'AVAX', name: 'Avalanche', decimals: 18 },
    { symbol: 'MATIC', name: 'Polygon', decimals: 18 },
    { symbol: 'DOGE', name: 'Dogecoin', decimals: 8 },
    { symbol: 'XRP', name: 'XRP', decimals: 6 },
    { symbol: 'ADA', name: 'Cardano', decimals: 6 },
    { symbol: 'DOT', name: 'Polkadot', decimals: 10 },
    { symbol: 'LINK', name: 'Chainlink', decimals: 18 },
    { symbol: 'UNI', name: 'Uniswap', decimals: 18 },
    { symbol: 'ATOM', name: 'Cosmos', decimals: 6 },
    { symbol: 'NEAR', name: 'NEAR Protocol', decimals: 24 },
    { symbol: 'APT', name: 'Aptos', decimals: 8 },
    { symbol: 'ARB', name: 'Arbitrum', decimals: 18 },
    { symbol: 'OP', name: 'Optimism', decimals: 18 },
    { symbol: 'LTC', name: 'Litecoin', decimals: 8 },
    { symbol: 'BCH', name: 'Bitcoin Cash', decimals: 8 },
    { symbol: 'HYPE', name: 'Hyperliquid', decimals: 8 },
    { symbol: 'PEPE', name: 'Pepe', decimals: 18 },
];

const MARKETS: Array<{
    base: string;
    quote: string;
    lotExp: number;
    tickExp: number;
    minQuantity: bigint;
}> = [
    {
        base: 'BTC',
        quote: 'USDC',
        lotExp: 8,
        tickExp: 1,
        minQuantity: 100n,
    },
    {
        base: 'ETH',
        quote: 'USDC',
        lotExp: 6,
        tickExp: 2,
        minQuantity: 1000n,
    },
    {
        base: 'SOL',
        quote: 'USDC',
        lotExp: 6,
        tickExp: 2,
        minQuantity: 1000n,
    },
    {
        base: 'AVAX',
        quote: 'USDC',
        lotExp: 4,
        tickExp: 3,
        minQuantity: 5000n,
    },
    {
        base: 'MATIC',
        quote: 'USDC',
        lotExp: 2,
        tickExp: 4,
        minQuantity: 10000n,
    },
    {
        base: 'DOGE',
        quote: 'USDC',
        lotExp: 2,
        tickExp: 5,
        minQuantity: 100000n,
    },
    {
        base: 'XRP',
        quote: 'USDC',
        lotExp: 2,
        tickExp: 4,
        minQuantity: 10000n,
    },
    {
        base: 'ADA',
        quote: 'USDC',
        lotExp: 2,
        tickExp: 4,
        minQuantity: 10000n,
    },
    {
        base: 'DOT',
        quote: 'USDC',
        lotExp: 4,
        tickExp: 3,
        minQuantity: 1000n,
    },
    {
        base: 'LINK',
        quote: 'USDC',
        lotExp: 4,
        tickExp: 3,
        minQuantity: 1000n,
    },
    {
        base: 'UNI',
        quote: 'USDC',
        lotExp: 4,
        tickExp: 3,
        minQuantity: 1000n,
    },
    {
        base: 'ATOM',
        quote: 'USDC',
        lotExp: 4,
        tickExp: 3,
        minQuantity: 1000n,
    },
    {
        base: 'NEAR',
        quote: 'USDC',
        lotExp: 4,
        tickExp: 3,
        minQuantity: 1000n,
    },
    {
        base: 'APT',
        quote: 'USDC',
        lotExp: 4,
        tickExp: 3,
        minQuantity: 1000n,
    },
    {
        base: 'ARB',
        quote: 'USDC',
        lotExp: 2,
        tickExp: 4,
        minQuantity: 10000n,
    },
    {
        base: 'OP',
        quote: 'USDC',
        lotExp: 2,
        tickExp: 4,
        minQuantity: 10000n,
    },
    {
        base: 'LTC',
        quote: 'USDC',
        lotExp: 6,
        tickExp: 2,
        minQuantity: 1000n,
    },
    {
        base: 'BCH',
        quote: 'USDC',
        lotExp: 6,
        tickExp: 2,
        minQuantity: 1000n,
    },
    {
        base: 'HYPE',
        quote: 'USDC',
        lotExp: 4,
        tickExp: 4,
        minQuantity: 1000n,
    },
    {
        base: 'PEPE',
        quote: 'USDC',
        lotExp: 0,
        tickExp: 8,
        minQuantity: 1000000n,
    },
];

async function main() {
    for (const asset of ASSETS) {
        await prisma.asset.upsert({
            where: { symbol: asset.symbol },
            create: asset,
            update: { name: asset.name, decimals: asset.decimals },
        });
    }
    console.log(`seeded ${ASSETS.length} assets`);

    for (const market of MARKETS) {
        const existing = await prisma.markets.findFirst({
            where: { base: market.base, quote: market.quote },
        });

        const { lotExp, tickExp, minQuantity } = market;

        await prisma.markets.upsert({
            where: { id: existing?.id ?? randomUUID() },
            create: {
                id: randomUUID(),
                base: market.base,
                quote: market.quote,
                lotExp,
                tickExp,
                minQuantity,
            },
            update: {
                lotExp,
                tickExp,
                minQuantity,
            },
        });
    }
    console.log(`seeded ${MARKETS.length} markets`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
