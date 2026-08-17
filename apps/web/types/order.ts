// Mirrors apps/engine/src/engine/order.rs
export type Side = 'bid' | 'ask';

export type OrderKind = 'LimitGtc' | 'Market' | 'Ioc' | 'Fok' | 'PostOnly';

export type OrderTypeTab = 'limit' | 'market';

export type TimeInForce = 'gtc' | 'ioc' | 'fok';
