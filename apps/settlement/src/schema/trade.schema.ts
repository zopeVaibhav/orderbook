import z from 'zod';

export const tradeOutSchema = z.object({
    type: z.literal('trade'),
    market_id: z.string(),
    trade_id: z.number().int().nonnegative(),
    price: z.string(),
    quantity: z.string(),
    maker_user_id: z.string(),
    maker_client_order_id: z.string(),
    taker_user_id: z.string(),
    taker_client_order_id: z.string(),
    taker_side: z.enum(['Ask', 'Bid']),
    ts: z.number(),
    seq: z.number().int(),
});

export type TradeOut = z.infer<typeof tradeOutSchema>;
