export const Side = {
    BID: 'BID',
    ASK: 'ASK',
} as const;
export type Side = (typeof Side)[keyof typeof Side];

export const OrderKind = {
    LIMIT: 'LIMIT',
    MARKET: 'MARKET',
} as const;
export type OrderKind = (typeof OrderKind)[keyof typeof OrderKind];

export const TimeInForce = {
    GTC: 'GTC',
    IOC: 'IOC',
    FOK: 'FOK',
    POST_ONLY: 'POST_ONLY',
} as const;
export type TimeInForce = (typeof TimeInForce)[keyof typeof TimeInForce];

export const OrderStatus = {
    PENDING: 'PENDING',
    RESTED: 'RESTED',
    PARTIAL: 'PARTIAL',
    FILLED: 'FILLED',
    CANCELLED: 'CANCELLED',
    REJECTED: 'REJECTED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const MarketStatus = {
    ACTIVE: 'ACTIVE',
    PAUSED: 'PAUSED',
    DELISTED: 'DELISTED',
} as const;
export type MarketStatus = (typeof MarketStatus)[keyof typeof MarketStatus];
