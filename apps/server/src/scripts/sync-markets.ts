import { prisma } from '@repo/database';
import MarketProducer from '../kafka/kafka.market-producer';
import chalk from 'chalk';

class SyncMarkets {
    static async process() {
        await MarketProducer.connect();
        try {
            const markets = await prisma.markets.findMany({
                where: {
                    status: 'ACTIVE',
                },
                select: {
                    id: true,
                    tickExp: true,
                    lotExp: true,
                    minQuantity: true,
                },
            });

            for (const market of markets) {
                await MarketProducer.publishNewMarket({
                    market_id: market.id,
                    tick_exp: market.tickExp,
                    lot_exp: market.lotExp,
                    min_quantity: market.minQuantity.toString(),
                });
            }

            return markets.length;
        } finally {
            await MarketProducer.disconnect();
            await prisma.$disconnect();
        }
    }
}

SyncMarkets.process()
    .then((n) => console.log(chalk.green(`synced ${n} markets`)))
    .catch((e) => {
        console.error(chalk.red('market sync failed:'), e);
        process.exit(1);
    });
