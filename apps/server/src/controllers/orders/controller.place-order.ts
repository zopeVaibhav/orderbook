import { Request, Response } from 'express';
import { ResponseWriter } from '../../services/service.response';
import { z } from 'zod';
import { OrderKind, Side, TimeInForce } from '@repo/types';
import type { OrderKind as EngineOrderKind } from '@repo/types/kafka';
import OrderProducer from '../../kafka/kafka.order-producer';

/**
 * `side` needs no mapping — the engine renames its variants to
 * SCREAMING_SNAKE_CASE, so BID/ASK is one vocabulary end to end. Order kind
 * does: the engine collapses kind and time-in-force into a single flat enum.
 */
const ENGINE_LIMIT_KIND: Record<TimeInForce, EngineOrderKind> = {
    [TimeInForce.GTC]: 'LimitGtc',
    [TimeInForce.IOC]: 'Ioc',
    [TimeInForce.FOK]: 'Fok',
    [TimeInForce.POST_ONLY]: 'PostOnly',
};

/**
    Money never crosses the wire as a JS number — 0.1 + 0.2 is not 0.3, and the
    engine holds these as scaled integers. Decimal strings all the way down.
 */
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

            if (data.kind === OrderKind.LIMIT && !data.timeInForce) {
                return ResponseWriter.invalidData(res);
            }

            const orderKind: EngineOrderKind =
                data.kind === OrderKind.MARKET
                    ? 'Market'
                    : ENGINE_LIMIT_KIND[data.timeInForce as TimeInForce];

            await OrderProducer.publishNewOrder({
                client_order_id: data.clientOrderId,
                user_id: userId,
                market_id: data.marketId,
                side: data.side,
                order_kind: orderKind,
                price: data.price,
                quantity: data.quantity,
            });

            return ResponseWriter.success(res, data);
        } catch (error) {
            return ResponseWriter.systemError(res, error);
        }
    }
}
