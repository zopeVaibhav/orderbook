import { Request, Response } from 'express';
import { z } from 'zod';
import { OrderStatus, prisma } from '@repo/database';
import { ResponseWriter } from '../../services/service.response';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

const OPEN = [OrderStatus.PENDING, OrderStatus.RESTED, OrderStatus.PARTIAL];
const CLOSED = [OrderStatus.FILLED, OrderStatus.CANCELLED, OrderStatus.REJECTED];

export const query_schema = z.object({
    status: z.enum(['open', 'closed']).default('open'),
    marketId: z.string().min(1).optional(),
    limit: z.coerce.number().int().positive().max(MAX_LIMIT).default(DEFAULT_LIMIT),
});

export default class ListOrdersController {
    static async process(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) return ResponseWriter.unauthorized(res);

            const query = query_schema.safeParse(req.query);
            if (!query.success) return ResponseWriter.invalidData(res, 'invalid query');

            const { status, marketId, limit } = query.data;

            const rows = await prisma.order.findMany({
                where: {
                    userId,
                    status: { in: status === 'open' ? OPEN : CLOSED },
                    ...(marketId ? { marketId } : {}),
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                select: {
                    clientOrderId: true,
                    marketId: true,
                    side: true,
                    kind: true,
                    timeInForce: true,
                    price: true,
                    quantity: true,
                    filledQuantity: true,
                    status: true,
                    rejectReason: true,
                    createdAt: true,
                    marketRef: { select: { base: true, quote: true } },
                },
            });

            const orders = rows.map((row) => ({
                clientOrderId: row.clientOrderId,
                marketId: row.marketId,
                base: row.marketRef.base,
                quote: row.marketRef.quote,
                side: row.side,
                kind: row.kind,
                timeInForce: row.timeInForce,
                price: row.price?.toString() ?? null,
                quantity: row.quantity.toString(),
                filledQuantity: row.filledQuantity.toString(),
                status: row.status,
                rejectReason: row.rejectReason,
                createdAt: row.createdAt.getTime(),
            }));

            return ResponseWriter.success(res, { orders });
        } catch (error) {
            return ResponseWriter.systemError(res, error);
        }
    }
}
