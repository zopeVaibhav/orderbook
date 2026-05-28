use crate::{
    io::outgoing::{AckStatus, BookDelta, BookDeltaEntry, OrderAck, OutgoingEvent, TradeOut},
    types::{
        CancelOrderErr, CancelOrderOutcome, CancelOrderPayload, Leftover, Market, NewOrderPayload,
        PlaceOrderErr, PlaceOrderOutcome, Quantity,
    },
};

fn to_decimal_string(value: u64, exp: u8) -> String {
    let exp = exp as usize;
    if exp == 0 {
        return value.to_string();
    }
    let digits = value.to_string();
    if digits.len() > exp {
        let point = digits.len() - exp;
        format!("{}.{}", &digits[..point], &digits[point..])
    } else {
        format!("0.{digits:0>exp$}")
    }
}

impl AckStatus {
    fn from_outcome(leftover: &Leftover, had_fills: bool) -> Self {
        match (leftover, had_fills) {
            (Leftover::None, true) => AckStatus::Filled,
            (Leftover::None, false) => {
                debug_assert!(false, "Leftover::None without fills - engine bug");
                AckStatus::Cancelled
            }
            (Leftover::Rested { .. }, true) => AckStatus::Partial,
            (Leftover::Rested { .. }, false) => AckStatus::Rested,
            (Leftover::Cancelled { .. }, true) => AckStatus::Partial,
            (Leftover::Cancelled { .. }, false) => AckStatus::Cancelled,
        }
    }
}

impl OutgoingEvent {
    pub fn new_order_events(
        outcome: Result<PlaceOrderOutcome, PlaceOrderErr>,
        payload: &NewOrderPayload,
        market: &Market,
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
                    filled_qty: to_decimal_string(total_filled_quantity, market.lot_exp),
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
                        filled_qty: to_decimal_string(0, market.lot_exp),
                        reason: Some("self trade prevention".to_string()),
                        ts,
                        seq,
                    }))
                }

                for fill in &outcome.fills {
                    events.push(OutgoingEvent::Trade(TradeOut {
                        market_id: payload.market_id.clone(),
                        trade_id: fill.trade_id,
                        price: to_decimal_string(fill.price, market.tick_exp),
                        quantity: to_decimal_string(fill.quantity, market.lot_exp),
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
                            price: to_decimal_string(e.price, market.tick_exp),
                            new_quantity: to_decimal_string(e.new_quantity, market.lot_exp),
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
                filled_qty: to_decimal_string(0, market.lot_exp),
                reason: Some(format!("{e:?}")),
                ts,
                seq,
            })),
        }
        events
    }

    pub fn cancel_order_events(
        outcome: Result<CancelOrderOutcome, CancelOrderErr>,
        payload: &CancelOrderPayload,
        market: &Market,
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
                    filled_qty: to_decimal_string(0, market.lot_exp),
                    reason: None,
                    ts,
                    seq,
                }));

                events.push(OutgoingEvent::BookDelta(BookDelta {
                    market_id: payload.market_id.clone(),
                    changes: vec![BookDeltaEntry {
                        side: outcome.side,
                        price: to_decimal_string(outcome.price, market.tick_exp),
                        new_quantity: to_decimal_string(outcome.new_level_quantity, market.lot_exp),
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
                filled_qty: to_decimal_string(0, market.lot_exp),
                reason: Some(format!("{:?}", e)),
                ts,
                seq,
            })),
        }
        events
    }
}
