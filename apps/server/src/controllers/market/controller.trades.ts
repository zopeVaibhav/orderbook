import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@repo/database';
import type { PublicTrade } from '@repo/types/socket';
import { ResponseWriter } from '../../services/service.response';

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 1000;

export const params_schema = z.object({
    marketId: z.string().min(1),
});

export const query_schema = z.object({
    limit: z.coerce.number().int().positive().max(MAX_LIMIT).default(DEFAULT_LIMIT),
});

export default class TradesController {
    static async process(req: Request, res: Response) {
        try {
            const params = params_schema.safeParse(req.params);
            if (!params.success) return ResponseWriter.invalidData(res, 'marketId is required');

            const query = query_schema.safeParse(req.query);
            if (!query.success) return ResponseWriter.invalidData(res, 'invalid limit');

            const rows = await prisma.trade.findMany({
                where: { marketId: params.data.marketId },
                orderBy: [{ ts: 'desc' }, { tradeId: 'desc' }],
                take: query.data.limit,
                select: {
                    marketId: true,
                    tradeId: true,
                    price: true,
                    quantity: true,
                    takerSide: true,
                    ts: true,
                    seq: true,
                },
            });

            const trades: PublicTrade[] = rows.reverse().map((row) => ({
                market_id: row.marketId,
                trade_id: Number(row.tradeId),
                price: row.price.toString(),
                quantity: row.quantity.toString(),
                taker_side: row.takerSide,
                ts: Number(row.ts),
                seq: Number(row.seq),
            }));

            return ResponseWriter.success(res, { trades });
        } catch (error) {
            return ResponseWriter.systemError(res, error);
        }
    }
}
