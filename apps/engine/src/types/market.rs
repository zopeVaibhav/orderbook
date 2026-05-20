use std::ops::Bound;

use crate::types::{
    aliases::{Price, Quantity, UserId},
    book::Book,
    order::{Order, Side},
    outcome::{Fill, PlaceOrderOutcome, StpCancellation},
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
}

impl MarketState {
    pub fn would_cross(&self, side: &Side, price: Price) -> bool {
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
    ) {
        let new_order = Order {
            user_id: order.user_id.clone(),
            client_order_id: order.client_order_id.clone(),
            quantity,
        };
        match side {
            Side::Ask => {
                self.book
                    .asks
                    .entry(price)
                    .or_default()
                    .push_back(new_order);
            }
            Side::Bid => {
                self.book
                    .bids
                    .entry(price)
                    .or_default()
                    .push_back(new_order);
            }
        };
        self.book.cancel_index.insert(
            (order.user_id.clone(), order.client_order_id.clone()),
            (side, price),
        );
    }

    pub fn match_against(
        &mut self,
        side: &Side,
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
                    while remaining_quantity > 0 && !queue.is_empty() {
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
                    while remaining_quantity > 0 && !queue.is_empty() {
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
