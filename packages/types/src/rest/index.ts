import type { Side } from '../domain/enums';

export interface ApiMarket {
    id: string;
    base: string;
    quote: string;
    tickExp: number;
    lotExp: number;
    minQuantity: string;
    makerEnabled: boolean;
    baseRef: { name: string; decimals: number };
    quoteRef: { name: string; decimals: number };
}

export interface MarketStats {
    marketId: string;
    lastPrice: string;
    openPrice: string;
    change24h: number;
    volume24h: string;
}

export interface Balance {
    asset: string;
    available: string;
    locked: string;
}

export type FillRole = 'MAKER' | 'TAKER';

export interface UserFill {
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
}
