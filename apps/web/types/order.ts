import type {
    OrderKind as ApiOrderKind,
    OrderStatus as ApiOrderStatus,
    Side as ApiSide,
    TimeInForce as ApiTimeInForce,
} from '@repo/types';

export type Side = 'bid' | 'ask';

export type { EngineOrderKind as OrderKind } from '@repo/types/kafka';

export type OrderTypeTab = 'limit' | 'market';

export type TimeInForce = 'gtc' | 'ioc' | 'fok';

export type OrderStatusFilter = 'open' | 'closed';

export type UserOrder = {
    clientOrderId: string;
    marketId: string;
    base: string;
    quote: string;
    side: ApiSide;
    kind: ApiOrderKind;
    timeInForce: ApiTimeInForce | null;
    price: string | null;
    quantity: string;
    filledQuantity: string;
    status: ApiOrderStatus;
    rejectReason: string | null;
    createdAt: number;
};
