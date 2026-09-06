import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma, Side } from '@repo/database';
import { ResponseWriter } from '../../services/service.response';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export const query_schema = z.object({
    marketId: z.string().min(1).optional(),
    limit: z.coerce.number().int().positive().max(MAX_LIMIT).default(DEFAULT_LIMIT),
});

function opposite(side: Side): Side {
    return side === Side.BID ? Side.ASK : Side.BID;
}

export default class ListFillsController {
    static async process(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) return ResponseWriter.unauthorized(res);

            const query = query_schema.safeParse(req.query);
            if (!query.success) return ResponseWriter.invalidData(res, 'invalid query');

            const { marketId, limit } = query.data;

            const rows = await prisma.trade.findMany({
                where: {
                    OR: [{ makerUserId: userId }, { takerUserId: userId }],
                    ...(marketId ? { marketId } : {}),
                },
                orderBy: { ts: 'desc' },
                take: limit,
                select: {
                    tradeId: true,
                    marketId: true,
                    price: true,
                    quantity: true,
                    takerSide: true,
                    takerUserId: true,
                    makerClientOrderId: true,
                    takerClientOrderId: true,
                    ts: true,
                    marketRef: { select: { base: true, quote: true } },
                },
            });

            const fills = rows.map((row) => {
                const isTaker = row.takerUserId === userId;

                return {
                    tradeId: Number(row.tradeId),
                    marketId: row.marketId,
                    base: row.marketRef.base,
                    quote: row.marketRef.quote,
                    clientOrderId: isTaker ? row.takerClientOrderId : row.makerClientOrderId,
                    side: isTaker ? row.takerSide : opposite(row.takerSide),
                    role: isTaker ? 'TAKER' : 'MAKER',
                    price: row.price.toString(),
                    quantity: row.quantity.toString(),
                    ts: Number(row.ts),
                };
            });

            return ResponseWriter.success(res, { fills });
        } catch (error) {
            return ResponseWriter.systemError(res, error);
        }
    }
}
