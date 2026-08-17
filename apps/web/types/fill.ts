import type { Side } from './order';

export type UserFill = {
    id: string;
    symbol: string;
    side: Side;
    size: number;
    price: number;
    timestamp: number;
};
