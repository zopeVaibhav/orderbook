import type { Side } from '@repo/types';

export type FillRole = 'MAKER' | 'TAKER';

export type UserFill = {
    tradeId: number;
    marketId: string;
    base: string;
    quote: string;
    clientOrderId: string;
    side: Side;
    role: FillRole;
    price: string;
    quantity: string;
    ts: number;
};
