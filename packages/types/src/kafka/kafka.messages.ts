import type { Side } from '../engine-events';

export type OrderKind = 'LimitGtc' | 'Market' | 'Ioc' | 'Fok' | 'PostOnly';

export interface NewOrderPayload {
    client_order_id: string;
    user_id: string;
    market_id: string;
    side: Side;
    order_kind: OrderKind;
    price?: string;
    quantity: string;
}

export interface CancelOrderPayload {
    client_order_id: string;
    user_id: string;
    market_id: string;
}

export type IncomingOrder =
    ({ type: 'new_order' } & NewOrderPayload) | ({ type: 'cancel_order' } & CancelOrderPayload);
