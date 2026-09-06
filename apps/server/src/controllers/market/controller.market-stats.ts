import { Request, Response } from 'express';
import { Prisma, prisma } from '@repo/database';
import { ResponseWriter } from '../../services/service.response';

const WINDOW_MS = 24 * 60 * 60 * 1000;

type StatsRow = {
    marketId: string;
    volume: Prisma.Decimal | null;
    open_price: Prisma.Decimal;
    last_price: Prisma.Decimal;
};

export default class MarketStatsController {
    static async process(_req: Request, res: Response) {
        try {
            const since = BigInt(Date.now() - WINDOW_MS);

            const rows = await prisma.$queryRaw<StatsRow[]>`
                SELECT "marketId",
                       SUM(price * quantity) AS volume,
                       (array_agg(price ORDER BY ts ASC, "tradeId" ASC))[1] AS open_price,
                       (array_agg(price ORDER BY ts DESC, "tradeId" DESC))[1] AS last_price
                FROM "Trade"
                WHERE ts >= ${since}
                GROUP BY "marketId"
            `;

            const stats = rows.map((row) => {
                const open = row.open_price;
                const last = row.last_price;
                const change = open.isZero() ? 0 : last.minus(open).div(open).mul(100).toNumber();

                return {
                    marketId: row.marketId,
                    lastPrice: last.toString(),
                    openPrice: open.toString(),
                    change24h: change,
                    volume24h: (row.volume ?? new Prisma.Decimal(0)).toString(),
                };
            });

            return ResponseWriter.success(res, { stats });
        } catch (error) {
            return ResponseWriter.systemError(res, error);
        }
    }
}
