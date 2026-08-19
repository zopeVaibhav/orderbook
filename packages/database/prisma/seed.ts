import { randomUUID } from 'node:crypto';
import { prisma } from '../src/prisma';

async function main() {
    await prisma.asset.upsert({
        where: { symbol: 'USDC' },
        create: { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
        update: { name: 'USD Coin', decimals: 6 },
    });

    await prisma.asset.upsert({
        where: { symbol: 'SOL' },
        create: { symbol: 'SOL', name: 'Solana', decimals: 9 },
        update: { name: 'Solana', decimals: 9 },
    });

    const existing = await prisma.markets.findFirst({
        where: { base: 'SOL', quote: 'USDC' },
    });

    await prisma.markets.upsert({
        where: { id: existing?.id ?? randomUUID() },
        create: {
            id: randomUUID(),
            base: 'SOL',
            quote: 'USDC',
            lotExp: 6,
            tickExp: 2,
            minQuantity: BigInt(1000),
            makerFeeBps: 10,
            takerFeeBps: 20,
        },
        update: {
            lotExp: 6,
            tickExp: 2,
            minQuantity: BigInt(1000),
            makerFeeBps: 10,
            takerFeeBps: 20,
        },
    });

    console.log('seeded assets + markets');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
