import type { BookDelta, OrderAck, Side } from '../kafka/engine-events';

export interface BookSnapshotPayload {
    market_id: string;
    asks: [string, string][];
    bids: [string, string][];
    seq: number;
}

export interface PublicTrade {
    market_id: string;
    trade_id: number;
    price: string;
    quantity: string;
    taker_side: Side;
    ts: number;
    seq: number;
}

export type ClientSocketMessage =
    { type: 'subscribe'; market_id: string } | { type: 'auth'; token: string };

export type ServerSocketMessage =
    | ({ type: 'trade' } & PublicTrade)
    | ({ type: 'book_delta' } & BookDelta)
    | ({ type: 'ack' } & OrderAck)
    | { type: 'balance_stale' };
