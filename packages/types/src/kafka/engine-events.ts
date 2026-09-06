import type { AckStatus, EngineEventType, Side } from './kafka.enums';

export interface OrderAck {
    market_id: string;
    user_id: string;
    client_order_id: string;
    status: AckStatus;
    filled_qty: string;
    reason: string | null;
    ts: number;
    seq: number;
}

export interface TradeOut {
    market_id: string;
    trade_id: number;
    price: string;
    quantity: string;
    maker_user_id: string;
    maker_client_order_id: string;
    taker_user_id: string;
    taker_client_order_id: string;
    taker_side: Side;
    ts: number;
    seq: number;
}

export interface BookDeltaEntry {
    side: Side;
    price: string;
    new_quantity: string;
}

export interface BookDelta {
    market_id: string;
    changes: BookDeltaEntry[];
    ts: number;
    seq: number;
}

export type EngineEvent =
    | ({ type: typeof EngineEventType.ACK } & OrderAck)
    | ({ type: typeof EngineEventType.TRADE } & TradeOut)
    | ({ type: typeof EngineEventType.BOOK_DELTA } & BookDelta);
