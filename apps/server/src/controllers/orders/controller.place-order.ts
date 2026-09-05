import { Request, Response } from 'express';
import { ResponseWriter } from '../../services/service.response';
import { z } from 'zod';
import { OrderKind, Side, TimeInForce } from '@repo/types';
import type { OrderKind as EngineOrderKind } from '@repo/types/kafka';
import { acceptOrder, prisma, releaseReserve, reserveFor } from '@repo/database';
import { isJsonSafe, scale } from '@repo/money';
import OrderProducer from '../../kafka/producers/kafka.order-producer';
import SocketServer from '../../socket/socket.server';

const ENGINE_LIMIT_KIND: Record<TimeInForce, EngineOrderKind> = {
    [TimeInForce.GTC]: 'LimitGtc',
    [TimeInForce.IOC]: 'Ioc',
    [TimeInForce.FOK]: 'Fok',
    [TimeInForce.POST_ONLY]: 'PostOnly',
};

const positiveDecimal = z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'must be a decimal string')
    .refine((value) => Number(value) > 0, 'must be greater than zero');

export const body_schema = z
    .object({
        marketId: z.string().min(1),
        clientOrderId: z.string().min(1).max(64),
        side: z.enum(Side),
        kind: z.enum(OrderKind),
        timeInForce: z.enum(TimeInForce).optional(),
        price: positiveDecimal.optional(),
        quantity: positiveDecimal,
    })
    .superRefine((body, ctx) => {
        if (body.kind === OrderKind.LIMIT) {
            if (body.price === undefined) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['price'],
                    message: 'price is required for LIMIT orders',
                });
            }
            if (body.timeInForce === undefined) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['timeInForce'],
                    message: 'timeInForce is required for LIMIT orders',
                });
            }
            return;
        }

        if (body.price !== undefined) {
            ctx.addIssue({
                code: 'custom',
                path: ['price'],
                message: 'price is not allowed on MARKET orders',
            });
        }
        if (body.timeInForce !== undefined) {
            ctx.addIssue({
                code: 'custom',
                path: ['timeInForce'],
                message: 'timeInForce is not allowed on MARKET orders',
            });
        }
    });

export type PlaceOrderBody = z.infer<typeof body_schema>;

export default class PlaceOrderController {
    static async process(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) return ResponseWriter.unauthorized(res);

            const parsed = body_schema.safeParse(req.body);
            if (!parsed.success) return ResponseWriter.invalidData(res);

            const { data } = parsed;

            const market = await prisma.markets.findUnique({
                where: { id: data.marketId },
                select: {
                    base: true,
                    quote: true,
                    status: true,
                    minQuantity: true,
                    lotExp: true,
                    tickExp: true,
                },
            });

            if (!market || market.status !== 'ACTIVE') {
                return ResponseWriter.notFound(res, 'market not tradable');
            }

            const scaledQuantity = scale(data.quantity, market.lotExp);
            if (scaledQuantity === null || scaledQuantity < market.minQuantity) {
                return ResponseWriter.invalidData(res, 'quantity below the market minimum');
            }

            const scaledPrice =
                data.price === undefined ? undefined : scale(data.price, market.tickExp);
            if (scaledPrice === null) {
                return ResponseWriter.invalidData(res, 'price is finer than the market tick');
            }

            if (!isJsonSafe(scaledQuantity, scaledPrice)) {
                return ResponseWriter.invalidData(res, 'order is too large to encode');
            }

            const orderKind: EngineOrderKind =
                data.kind === OrderKind.MARKET
                    ? 'Market'
                    : ENGINE_LIMIT_KIND[data.timeInForce as TimeInForce];
            const reserve = reserveFor(market, data.side, data.kind, data.price, data.quantity);
            if (!reserve) {
                return ResponseWriter.invalidData(res, 'market buys are not supported yet');
            }

            const accepted = await acceptOrder({
                userId,
                clientOrderId: data.clientOrderId,
                marketId: data.marketId,
                side: data.side,
                kind: data.kind,
                timeInForce: data.timeInForce,
                price: data.price,
                quantity: data.quantity,
                reserve,
            });

            if (!accepted.ok) {
                return ResponseWriter.invalidData(res, accepted.reason, 'insufficient balance');
            }

            try {
                await OrderProducer.publishNewOrder({
                    client_order_id: data.clientOrderId,
                    user_id: userId,
                    market_id: data.marketId,
                    side: data.side,
                    order_kind: orderKind,
                    price: scaledPrice === undefined ? undefined : Number(scaledPrice),
                    quantity: Number(scaledQuantity),
                });
            } catch (error) {
                await releaseReserve(userId, data.clientOrderId);
                await prisma.order.update({
                    where: { userId_clientOrderId: { userId, clientOrderId: data.clientOrderId } },
                    data: { status: 'REJECTED', rejectReason: 'publish failed' },
                });
                throw error;
            }

            SocketServer.balanceStale(userId);

            return ResponseWriter.success(res, data);
        } catch (error) {
            return ResponseWriter.systemError(res, error);
        }
    }
}
