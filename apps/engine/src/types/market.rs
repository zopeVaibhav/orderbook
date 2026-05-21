use std::ops::Bound;

use crate::types::{
    aliases::{Price, Quantity, UserId},
    book::Book,
    order::{Order, Side},
    outcome::{Fill, LevelChange, PlaceOrderOutcome, StpCancellation},
    payload::NewOrderPayload,
};

#[derive(Debug, Clone)]
pub struct Market {
    pub(crate) tick_exp: u8,
    pub(crate) lot_exp: u8,
    pub(crate) min_quantity: u64,
}

#[derive(Debug)]
pub struct MarketState {
    pub(crate) market: Market,
    pub(crate) book: Book,
    pub(crate) last_applied_seq: i64,
}

impl MarketState {
    pub fn would_cross(&self, side: Side, price: Price) -> bool {
        match side {
            Side::Ask => self
                .book
                .bids
                .keys()
                .next_back()
                .is_some_and(|&b| b >= price),

            Side::Bid => self.book.asks.keys().next().is_some_and(|&b| b <= price),
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
                let mut empty_queue: Vec<Price> = Vec::new();
                for (price, queue) in self.book.bids.range_mut((start, Bound::Unbounded)).rev() {
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
                            self.book
                                .cancel_index
                                .remove(&(popped.user_id, popped.client_order_id));
                            continue;
                        };
                        if bid.quantity > remaining_quantity {
                            bid.quantity -= remaining_quantity;
                            outcome.fills.push(Fill {
                                price: *price,
                                quantity: remaining_quantity,
                                maker_user_id: bid.user_id.clone(),
                                maker_client_order_id: bid.client_order_id.clone(),
                            });
                            remaining_quantity = 0;
                        } else {
                            remaining_quantity -= bid.quantity;
                            outcome.fills.push(Fill {
                                price: *price,
                                quantity: bid.quantity,
                                maker_user_id: bid.user_id.clone(),
                                maker_client_order_id: bid.client_order_id.clone(),
                            });

                            let popped = queue.pop_front().unwrap();
                            self.book
                                .cancel_index
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
                    self.book.bids.remove(&key);
                }
                remaining_quantity
            }
            Side::Ask => {
                let end = match price {
                    Some(p) => Bound::Included(p),
                    None => Bound::Unbounded,
                };
                let mut remaining_quantity = quantity;
                let mut empty_queue: Vec<Price> = Vec::new();
                for (price, queue) in self.book.asks.range_mut((Bound::Unbounded, end)) {
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
                            self.book
                                .cancel_index
                                .remove(&(popped.user_id, popped.client_order_id));
                            continue;
                        };
                        if ask.quantity > remaining_quantity {
                            ask.quantity -= remaining_quantity;
                            outcome.fills.push(Fill {
                                price: *price,
                                quantity: remaining_quantity,
                                maker_user_id: ask.user_id.clone(),
                                maker_client_order_id: ask.client_order_id.clone(),
                            });
                            remaining_quantity = 0;
                        } else {
                            remaining_quantity -= ask.quantity;
                            outcome.fills.push(Fill {
                                price: *price,
                                quantity: ask.quantity,
                                maker_user_id: ask.user_id.clone(),
                                maker_client_order_id: ask.client_order_id.clone(),
                            });

                            let popped = queue.pop_front().unwrap();
                            self.book
                                .cancel_index
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
                    self.book.asks.remove(&key);
                }
                remaining_quantity
            }
        }
    }
}
