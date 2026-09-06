import type { BookDelta, OrderAck } from '../kafka/engine-events';
import type { Side } from '../kafka/kafka.enums';
import type { ClientMessageType, ServerMessageType } from './socket.enums';

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
    | { type: typeof ClientMessageType.SUBSCRIBE; market_id: string }
    | { type: typeof ClientMessageType.AUTH; token: string };

export type ServerSocketMessage =
    | ({ type: typeof ServerMessageType.TRADE } & PublicTrade)
    | ({ type: typeof ServerMessageType.BOOK_DELTA } & BookDelta)
    | ({ type: typeof ServerMessageType.ACK } & OrderAck)
    | { type: typeof ServerMessageType.BALANCE_STALE };
