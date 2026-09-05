import type { EngineOrderKind, IncomingOrderType, Side } from './kafka.enums';

export interface NewOrderPayload {
    client_order_id: string;
    user_id: string;
    market_id: string;
    side: Side;
    order_kind: EngineOrderKind;
    price?: number;
    quantity: number;
}

export interface CancelOrderPayload {
    client_order_id: string;
    user_id: string;
    market_id: string;
}

export type IncomingOrder =
    | ({ type: typeof IncomingOrderType.NEW_ORDER } & NewOrderPayload)
    | ({ type: typeof IncomingOrderType.CANCEL_ORDER } & CancelOrderPayload);
