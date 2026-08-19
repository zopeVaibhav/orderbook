use std::ops::Bound;

use serde::{Deserialize, Serialize};

use crate::engine::{
    Book, Fill, LevelChange, NewOrderPayload, Order, PlaceOrderOutcome, Price, Quantity, Side,
    StpCancellation, UserId,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Market {
    pub(crate) tick_exp: u8,
    pub(crate) lot_exp: u8,
    pub(crate) min_quantity: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MarketState {
    pub(crate) market: Market,
    pub(crate) book: Book,
    pub(crate) last_applied_seq: i64,
    pub(crate) next_trade_id: u64,
}

impl MarketState {
    pub fn would_cross(&self, side: Side, price: Price) -> bool {
        match side {
            Side::Ask => self
                .book
                .bids
                .keys()
                .next_back()
                .is_some_and(|&best_bid| best_bid >= price),

            Side::Bid => self
                .book
                .asks
                .keys()
                .next()
                .is_some_and(|&best_ask| best_ask <= price),
        }
    }

    pub fn rest_on_book(
        &mut self,
        side: Side,
        price: Price,
        order: &NewOrderPayload,
        quantity: Quantity,
    ) -> Quantity {
        let new_order = Order {
            user_id: order.user_id.clone(),
            client_order_id: order.client_order_id.clone(),
            quantity,
        };
        let queue = self.book.side_mut(side).entry(price).or_default();
        queue.push_back(new_order);
        let new_quantity = queue.iter().map(|o| o.quantity).sum();

        self.book.cancel_index.insert(
            (order.user_id.clone(), order.client_order_id.clone()),
            (side, price),
        );
        new_quantity
    }

    pub fn match_against(
        &mut self,
        side: Side,
        price: Option<Price>,
        user_id: &UserId,
        quantity: Quantity,
        outcome: &mut PlaceOrderOutcome,
    ) -> Quantity {
        match side {
            Side::Bid => {
                let start = match price {
                    Some(p) => Bound::Included(p),
                    None => Bound::Unbounded,
                };

                let mut remaining_quantity = quantity;
                let mut empty_queue = Vec::new();
                let next_trade_id = &mut self.next_trade_id;
                let book = &mut self.book;
                for (price, queue) in book.bids.range_mut((start, Bound::Unbounded)).rev() {
                    if remaining_quantity == 0 {
                        break;
                    }

                    let mut level_changed = false;
                    while remaining_quantity > 0 && !queue.is_empty() {
                        level_changed = true;
                        let bid = queue.front_mut().unwrap();
                        if bid.user_id == *user_id {
                            outcome.stp_cancellations.push(StpCancellation {
                                price: *price,
                                quantity: bid.quantity,
                                maker_user_id: bid.user_id.clone(),
                                maker_client_order_id: bid.client_order_id.clone(),
                            });
                            let popped = queue.pop_front().unwrap();
                            book.cancel_index
                                .remove(&(popped.user_id, popped.client_order_id));
                            continue;
                        };
                        if bid.quantity > remaining_quantity {
                            bid.quantity -= remaining_quantity;
                            let trade_id = *next_trade_id;
                            *next_trade_id += 1;
                            outcome.fills.push(Fill {
                                price: *price,
                                quantity: remaining_quantity,
                                trade_id,
                                maker_user_id: bid.user_id.clone(),
                                maker_client_order_id: bid.client_order_id.clone(),
                                maker_remaining_after: bid.quantity,
                            });
                            remaining_quantity = 0;
                        } else {
                            let maker_quantity = bid.quantity;
                            remaining_quantity -= maker_quantity;
                            let trade_id = *next_trade_id;
                            *next_trade_id += 1;
                            outcome.fills.push(Fill {
                                price: *price,
                                quantity: maker_quantity,
                                trade_id,
                                maker_user_id: bid.user_id.clone(),
                                maker_client_order_id: bid.client_order_id.clone(),
                                maker_remaining_after: 0,
                            });

                            let popped = queue.pop_front().unwrap();
                            book.cancel_index
                                .remove(&(popped.user_id, popped.client_order_id));
                        }
                    }

                    if level_changed {
                        let new_quantity = queue.iter().map(|o| o.quantity).sum();
                        outcome.level_changes.push(LevelChange {
                            side,
                            price: *price,
                            new_quantity,
                        })
                    }

                    if queue.is_empty() {
                        empty_queue.push(*price);
                    }
                }

                for key in empty_queue {
                    book.bids.remove(&key);
                }
                remaining_quantity
            }
            Side::Ask => {
                let end = match price {
                    Some(p) => Bound::Included(p),
                    None => Bound::Unbounded,
                };
                let mut remaining_quantity = quantity;
                let mut empty_queue = Vec::new();
                let book = &mut self.book;
                let next_trade_id = &mut self.next_trade_id;
                for (price, queue) in book.asks.range_mut((Bound::Unbounded, end)) {
                    if remaining_quantity == 0 {
                        break;
                    }
                    let mut level_changed = false;
                    while remaining_quantity > 0 && !queue.is_empty() {
                        level_changed = true;
                        let ask = queue.front_mut().unwrap();
                        if ask.user_id == *user_id {
                            outcome.stp_cancellations.push(StpCancellation {
                                price: *price,
                                quantity: ask.quantity,
                                maker_user_id: ask.user_id.clone(),
                                maker_client_order_id: ask.client_order_id.clone(),
                            });
                            let popped = queue.pop_front().unwrap();
                            book.cancel_index
                                .remove(&(popped.user_id, popped.client_order_id));
                            continue;
                        };
                        if ask.quantity > remaining_quantity {
                            ask.quantity -= remaining_quantity;
                            let trade_id = *next_trade_id;
                            *next_trade_id += 1;
                            outcome.fills.push(Fill {
                                price: *price,
                                quantity: remaining_quantity,
                                trade_id,
                                maker_user_id: ask.user_id.clone(),
                                maker_client_order_id: ask.client_order_id.clone(),
                                maker_remaining_after: ask.quantity,
                            });
                            remaining_quantity = 0;
                        } else {
                            let maker_quantity = ask.quantity;
                            remaining_quantity -= maker_quantity;
                            let trade_id = *next_trade_id;
                            *next_trade_id += 1;
                            outcome.fills.push(Fill {
                                price: *price,
                                quantity: maker_quantity,
                                trade_id,
                                maker_user_id: ask.user_id.clone(),
                                maker_client_order_id: ask.client_order_id.clone(),
                                maker_remaining_after: 0,
                            });

                            let popped = queue.pop_front().unwrap();
                            book.cancel_index
                                .remove(&(popped.user_id, popped.client_order_id));
                        }
                    }

                    if level_changed {
                        let new_quantity = queue.iter().map(|o| o.quantity).sum();
                        outcome.level_changes.push(LevelChange {
                            side,
                            price: *price,
                            new_quantity,
                        })
                    };

                    if queue.is_empty() {
                        empty_queue.push(*price);
                    }
                }

                for key in empty_queue {
                    book.asks.remove(&key);
                }
                remaining_quantity
            }
        }
    }
}
