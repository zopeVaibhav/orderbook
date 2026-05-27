pub mod build;

use crate::types::{ClientOrderId, MarketId, Side, UserId};
use serde::Serialize;

#[derive(Serialize)]
pub enum AckStatus {
    Filled,
    Partial,
    Rested,
    Cancelled,
    Rejected,
}

#[derive(Serialize)]
pub struct OrderAck {
    pub market_id: MarketId,
    pub user_id: UserId,
    pub client_order_id: ClientOrderId,
    pub status: AckStatus,
    pub filled_qty: String,
    pub reason: Option<String>,
    pub ts: u64,
    pub seq: i64,
}

#[derive(Serialize)]
pub struct TradeOut {
    pub market_id: MarketId,
    pub price: String,
    pub quantity: String,
    pub maker_user_id: UserId,
    pub maker_client_order_id: ClientOrderId,
    pub taker_user_id: UserId,
    pub taker_client_order_id: ClientOrderId,
    pub taker_side: Side,
    pub ts: u64,
    pub seq: i64,
}

#[derive(Serialize)]
pub struct BookDelta {
    pub market_id: MarketId,
    pub changes: Vec<BookDeltaEntry>,
    pub ts: u64,
    pub seq: i64,
}

#[derive(Serialize)]
pub struct BookDeltaEntry {
    pub side: Side,
    pub price: String,
    pub new_quantity: String,
}

#[derive(Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum OutgoingEvent {
    Ack(OrderAck),
    Trade(TradeOut),
    BookDelta(BookDelta),
}

impl OutgoingEvent {
    pub fn topic(&self) -> &'static str {
        match self {
            OutgoingEvent::Ack(_) => "orders.ack",
            OutgoingEvent::Trade(_) => "trades.out",
            OutgoingEvent::BookDelta(_) => "book.delta",
        }
    }

    pub fn key(&self) -> &str {
        match self {
            OutgoingEvent::Ack(a) => &a.market_id,
            OutgoingEvent::Trade(t) => &t.market_id,
            OutgoingEvent::BookDelta(b) => &b.market_id,
        }
    }
}
