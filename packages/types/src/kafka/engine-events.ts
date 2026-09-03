export type Side = 'ASK' | 'BID';

export type AckStatus = 'FILLED' | 'PARTIAL' | 'RESTED' | 'CANCELLED' | 'REJECTED';

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
    | ({ type: 'ack' } & OrderAck)
    | ({ type: 'trade' } & TradeOut)
    | ({ type: 'book_delta' } & BookDelta);

export interface BookSnapshotPayload {
    market_id: string;
    asks: [string, string][];
    bids: [string, string][];
    seq: number;
}
