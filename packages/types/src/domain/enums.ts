/**
 * Client-facing enums, shared by the API layer and the web app.
 *
 * Values mirror the Prisma enums exactly, so a value here assigns straight into
 * a Prisma field with no mapping. They are declared here rather than imported
 * from `@repo/database` because that package pulls the Node-only Prisma client,
 * which has no business in a browser bundle.
 *
 * Declared as const objects so `z.enum(Side)` and `Side.BID` both work off one
 * definition — add a value and the validators pick it up.
 *
 * Distinct from the engine's wire enums in `@repo/types/kafka`, which are
 * PascalCase and carry the engine's own vocabulary.
 */

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
