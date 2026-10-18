export type Side = 'bid' | 'ask';

export type { EngineOrderKind as OrderKind } from '@repo/types/kafka';

export type OrderTypeTab = 'limit' | 'market';

export type TimeInForce = 'gtc' | 'ioc' | 'fok';

export type OrderStatusFilter = 'open' | 'closed';

export type { UserOrder } from '@repo/types';
