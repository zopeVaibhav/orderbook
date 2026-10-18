import type { OrderKind, OrderStatus, Side, TimeInForce } from '../domain/enums';

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
    high24h: string;
    low24h: string;
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

export interface UserOrder {
    clientOrderId: string;
    marketId: string;
    base: string;
    quote: string;
    side: Side;
    kind: OrderKind;
    timeInForce: TimeInForce | null;
    price: string | null;
    quantity: string;
    filledQuantity: string;
    status: OrderStatus;
    rejectReason: string | null;
    createdAt: number;
    updatedAt: number;
}

export type CandleInterval = '1s' | '5s' | '15s' | '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export interface ApiCandle {
    time: number;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
}
