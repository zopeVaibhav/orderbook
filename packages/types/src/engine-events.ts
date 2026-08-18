/**
 * Mirrors apps/engine/src/protocol/outgoing.rs.
 *
 * Serde emits the enum internally tagged (`#[serde(tag = "type", rename_all =
 * "snake_case")]`), so variant fields sit alongside `type` rather than nested.
 *
 * Prices and quantities stay STRINGS end to end — the engine holds them as
 * scaled integers and renders them with the market's tick/lot exponents.
 * Parsing to a JS number loses precision on money; parse only to display.
 */

/** Rust `Side` derives Serialize with no rename, so it is PascalCase on the wire. */
export type Side = 'Ask' | 'Bid';

export type AckStatus = 'Filled' | 'Partial' | 'Rested' | 'Cancelled' | 'Rejected';

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
    /** "0" means the level is gone; anything else replaces the level outright. */
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

/**
 * Book state is delta-only on the wire, so a client needs a starting point
 * before deltas mean anything. The engine's own snapshots are bincode files for
 * its recovery — this is the shape the server will need to expose over REST.
 */
export interface BookSnapshotPayload {
    market_id: string;
    /** [price, quantity] pairs, both decimal strings. */
    asks: [string, string][];
    bids: [string, string][];
    seq: number;
}
