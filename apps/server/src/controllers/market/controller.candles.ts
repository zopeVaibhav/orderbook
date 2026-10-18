import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma, prisma } from '@repo/database';
import type { ApiCandle } from '@repo/types';
import { ResponseWriter } from '../../services/service.response';

const INTERVAL_MS = {
    '1s': 1_000,
    '5s': 5_000,
    '15s': 15_000,
    '1m': 60_000,
    '5m': 300_000,
    '15m': 900_000,
    '1h': 3_600_000,
    '4h': 14_400_000,
    '1d': 86_400_000,
} as const;

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 1000;

export const params_schema = z.object({
    marketId: z.string().min(1),
});

export const query_schema = z.object({
    interval: z.enum(Object.keys(INTERVAL_MS) as [keyof typeof INTERVAL_MS]).default('1m'),
    limit: z.coerce.number().int().positive().max(MAX_LIMIT).default(DEFAULT_LIMIT),
});

type CandleRow = {
    bucket: bigint;
    open: Prisma.Decimal;
    high: Prisma.Decimal;
    low: Prisma.Decimal;
    close: Prisma.Decimal;
    volume: Prisma.Decimal;
};

export default class CandlesController {
    static async process(req: Request, res: Response) {
        try {
            const params = params_schema.safeParse(req.params);
            if (!params.success) return ResponseWriter.invalidData(res, 'marketId is required');

            const query = query_schema.safeParse(req.query);
            if (!query.success) return ResponseWriter.invalidData(res, 'invalid interval or limit');

            const { interval, limit } = query.data;
            const ms = BigInt(INTERVAL_MS[interval]);
            const now = BigInt(Date.now());
            const since = (now / ms - BigInt(limit - 1)) * ms;

            const rows = await prisma.$queryRaw<CandleRow[]>`
                SELECT (ts / ${ms}) * ${ms} AS bucket,
                       (array_agg(price ORDER BY ts ASC, "tradeId" ASC))[1] AS open,
                       MAX(price) AS high,
                       MIN(price) AS low,
                       (array_agg(price ORDER BY ts DESC, "tradeId" DESC))[1] AS close,
                       SUM(quantity) AS volume
                FROM "Trade"
                WHERE "marketId" = ${params.data.marketId} AND ts >= ${since}
                GROUP BY bucket
                ORDER BY bucket ASC
            `;

            const candles: ApiCandle[] = rows.map((row) => ({
                time: Number(row.bucket),
                open: row.open.toString(),
                high: row.high.toString(),
                low: row.low.toString(),
                close: row.close.toString(),
                volume: row.volume.toString(),
            }));

            return ResponseWriter.success(res, { interval, candles });
        } catch (error) {
            return ResponseWriter.systemError(res, error);
        }
    }
}
