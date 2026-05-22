use crate::types::aliases::{ClientOrderId, MarketId, Price, Quantity, UserId};
use crate::types::order::Side;
use crate::types::outcome::{
    CancelOrderErr, CancelOrderOutcome, Leftover, PlaceOrderErr, PlaceOrderOutcome,
};
use crate::types::payload::{CancelOrderPayload, NewOrderPayload};

use serde::Serialize;

#[derive(Serialize)]
pub enum AckStatus {
    Filled,
    Partial,
    Rested,
    Cancelled,
    Rejected,
}

impl AckStatus {
    fn from_outcome(leftover: &Leftover, had_fills: bool) -> Self {
        match (leftover, had_fills) {
            (Leftover::None, true) => AckStatus::Filled,
            (Leftover::None, false) => unreachable!(),
            (Leftover::Rested { .. }, true) => AckStatus::Partial,
            (Leftover::Rested { .. }, false) => AckStatus::Rested,
            (Leftover::Cancelled { .. }, true) => AckStatus::Partial,
            (Leftover::Cancelled { .. }, false) => AckStatus::Cancelled,
        }
    }
}
#[derive(Serialize)]
pub struct OrderAck {
    pub market_id: MarketId,
    pub user_id: UserId,
    pub client_order_id: ClientOrderId,
    pub status: AckStatus,
    pub filled_qty: Quantity,
    pub reason: Option<String>,
    pub ts: u64,
    pub seq: i64,
}

#[derive(Serialize)]
pub struct TradeOut {
    pub market_id: MarketId,
    pub price: Price,
    pub quantity: Quantity,
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
    pub price: Price,
    pub new_quantity: Quantity,
}

#[derive(Serialize)]
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

    pub fn new_order_events(
        outcome: Result<PlaceOrderOutcome, PlaceOrderErr>,
        payload: &NewOrderPayload,
        ts: u64,
        seq: i64,
    ) -> Vec<OutgoingEvent> {
        let mut events: Vec<OutgoingEvent> = Vec::new();

        match outcome {
            Ok(outcome) => {
                let had_fills = !outcome.fills.is_empty();
                let total_filled_quantity: Quantity =
                    outcome.fills.iter().map(|f| f.quantity).sum();

                events.push(OutgoingEvent::Ack(OrderAck {
                    market_id: payload.market_id.clone(),
                    user_id: payload.user_id.clone(),
                    client_order_id: payload.client_order_id.clone(),
                    status: AckStatus::from_outcome(&outcome.leftover, had_fills),
                    filled_qty: total_filled_quantity,
                    reason: None,
                    ts,
                    seq,
                }));

                for stp in &outcome.stp_cancellations {
                    events.push(OutgoingEvent::Ack(OrderAck {
                        market_id: payload.market_id.clone(),
                        user_id: stp.maker_user_id.clone(),
                        client_order_id: stp.maker_client_order_id.clone(),
                        status: AckStatus::Cancelled,
                        filled_qty: 0,
                        reason: Some("self trade prevention".to_string()),
                        ts,
                        seq,
                    }))
                }

                for fill in &outcome.fills {
                    events.push(OutgoingEvent::Trade(TradeOut {
                        market_id: payload.market_id.clone(),
                        price: fill.price,
                        quantity: fill.quantity,
                        maker_user_id: fill.maker_user_id.clone(),
                        maker_client_order_id: fill.maker_client_order_id.clone(),
                        taker_user_id: payload.user_id.clone(),
                        taker_client_order_id: payload.client_order_id.clone(),
                        taker_side: payload.side,
                        ts,
                        seq,
                    }));
                }

                if !outcome.level_changes.is_empty() {
                    let book_delta_entries: Vec<BookDeltaEntry> = outcome
                        .level_changes
                        .iter()
                        .map(|e| BookDeltaEntry {
                            side: e.side,
                            price: e.price,
                            new_quantity: e.new_quantity,
                        })
                        .collect();

                    events.push(OutgoingEvent::BookDelta(BookDelta {
                        market_id: payload.market_id.clone(),
                        changes: book_delta_entries,
                        ts,
                        seq,
                    }));
                }
            }
            Err(e) => events.push(OutgoingEvent::Ack(OrderAck {
                market_id: payload.market_id.clone(),
                user_id: payload.user_id.clone(),
                client_order_id: payload.client_order_id.clone(),
                status: AckStatus::Rejected,
                filled_qty: 0,
                reason: Some(format!("{:?}", e)),
                ts,
                seq,
            })),
        }
        events
    }

    pub fn cancel_order_events(
        outcome: Result<CancelOrderOutcome, CancelOrderErr>,
        payload: &CancelOrderPayload,
        ts: u64,
        seq: i64,
    ) -> Vec<OutgoingEvent> {
        let mut events: Vec<OutgoingEvent> = Vec::new();
        match outcome {
            Ok(outcome) => {
                events.push(OutgoingEvent::Ack(OrderAck {
                    market_id: payload.market_id.clone(),
                    user_id: payload.user_id.clone(),
                    client_order_id: payload.client_order_id.clone(),
                    status: AckStatus::Cancelled,
                    filled_qty: 0,
                    reason: None,
                    ts,
                    seq,
                }));

                events.push(OutgoingEvent::BookDelta(BookDelta {
                    market_id: payload.market_id.clone(),
                    changes: vec![BookDeltaEntry {
                        side: outcome.side,
                        price: outcome.price,
                        new_quantity: outcome.new_level_quantity,
                    }],
                    ts,
                    seq,
                }));
            }
            Err(e) => events.push(OutgoingEvent::Ack(OrderAck {
                market_id: payload.market_id.clone(),
                user_id: payload.user_id.clone(),
                client_order_id: payload.client_order_id.clone(),
                status: AckStatus::Rejected,
                filled_qty: 0,
                reason: Some(format!("{:?}", e)),
                ts,
                seq,
            })),
        }
        events
    }
}
