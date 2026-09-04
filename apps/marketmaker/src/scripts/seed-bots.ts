import chalk from 'chalk';
import { LedgerReason, Prisma, prisma, RefType, writeLedger } from '@repo/database';
import { BOT_HANDLES, BOT_INVENTORY_NOTIONAL, SEED_PRICES, botEmail } from '../config/bots.config';

const QUOTE_ASSET = 'USDC';
const FUNDING_DECIMALS = 8;

function inventoryFor(asset: string): Prisma.Decimal | null {
    const notional = new Prisma.Decimal(BOT_INVENTORY_NOTIONAL);
    if (asset === QUOTE_ASSET) return notional;

    const price = SEED_PRICES[asset];
    if (price === undefined) return null;

    return notional.div(new Prisma.Decimal(price)).toDecimalPlaces(FUNDING_DECIMALS);
}

async function main() {
    const assets = await prisma.asset.findMany({ select: { symbol: true } });
    const known = new Set(assets.map((a) => a.symbol));

    const fundable = [QUOTE_ASSET, ...Object.keys(SEED_PRICES)].filter((asset) => {
        if (known.has(asset)) return true;
        console.warn(chalk.yellow(`skipping ${asset}: not a seeded asset`));
        return false;
    });

    let funded = 0;

    for (const handle of BOT_HANDLES) {
        const bot = await prisma.user.upsert({
            where: { email: botEmail(handle) },
            create: { email: botEmail(handle), name: handle, isBot: true },
            update: { isBot: true },
            select: { id: true },
        });

        for (const asset of fundable) {
            const amount = inventoryFor(asset);
            if (amount === null) continue;

            /** refId is derived from bot and asset, so re-running tops nothing
             *  up — the unique ledger key makes the whole script idempotent. */
            const written = await prisma.$transaction((tx) =>
                writeLedger(tx, [
                    {
                        userId: bot.id,
                        asset,
                        amount,
                        ledgerReason: LedgerReason.DEPOSIT,
                        refType: RefType.DEPOSIT,
                        refId: `bot-funding:${bot.id}:${asset}`,
                    },
                ]),
            );

            funded += written;
        }
    }

    console.log(
        chalk.green(
            `${BOT_HANDLES.length} bots ready, ${fundable.length} assets each, ${funded} new deposits`,
        ),
    );
}

main()
    .catch((error) => {
        console.error(chalk.red('seed-bots failed:'), error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
