import z from 'zod';

const positiveDecimalString = z.string().refine(
    (s) => {
        if (!/^\d+(\.\d+)?$/.test(s)) return false;
        return Number(s) > 0;
    },
    { message: 'must be a positive decimal string' },
);

export const tradeOutSchema = z.object({
    type: z.literal('trade'),
    market_id: z.string().min(1),
    trade_id: z.number().int().nonnegative(),
    price: positiveDecimalString,
    quantity: positiveDecimalString,
    maker_user_id: z.string().min(1),
    maker_client_order_id: z.string().min(1),
    taker_user_id: z.string().min(1),
    taker_client_order_id: z.string().min(1),
    taker_side: z.enum(['Ask', 'Bid']),
    ts: z.number(),
    seq: z.number().int(),
});

export type TradeOut = z.infer<typeof tradeOutSchema>;
