export const Side = {
    ASK: 'ASK',
    BID: 'BID',
} as const;
export type Side = (typeof Side)[keyof typeof Side];

export const AckStatus = {
    FILLED: 'FILLED',
    PARTIAL: 'PARTIAL',
    RESTED: 'RESTED',
    CANCELLED: 'CANCELLED',
    REJECTED: 'REJECTED',
} as const;
export type AckStatus = (typeof AckStatus)[keyof typeof AckStatus];

export const EngineEventType = {
    ACK: 'ack',
    TRADE: 'trade',
    BOOK_DELTA: 'book_delta',
} as const;
export type EngineEventType = (typeof EngineEventType)[keyof typeof EngineEventType];

export const EngineOrderKind = {
    LIMIT_GTC: 'LimitGtc',
    MARKET: 'Market',
    IOC: 'Ioc',
    FOK: 'Fok',
    POST_ONLY: 'PostOnly',
} as const;
export type EngineOrderKind = (typeof EngineOrderKind)[keyof typeof EngineOrderKind];

export const IncomingOrderType = {
    NEW_ORDER: 'new_order',
    CANCEL_ORDER: 'cancel_order',
} as const;
export type IncomingOrderType = (typeof IncomingOrderType)[keyof typeof IncomingOrderType];
