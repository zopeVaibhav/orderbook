use crate::types::{
    aliases::Price,
    engine::MarketState,
    order::Side,
    outcome::{Fill, Leftover, PlaceOrderErr, PlaceOrderOutcome, StpCancellation},
    payload::NewOrderPayload,
};

impl MarketState {
    pub fn place_ioc_order(
        &mut self,
        order: &NewOrderPayload,
    ) -> Result<PlaceOrderOutcome, PlaceOrderErr> {
        let book = &mut self.book;

        let mut outcome = PlaceOrderOutcome {
            fills: Vec::new(),
            leftover: Leftover::None,
            stp_cancellations: Vec::new(),
        };

        let Some(price) = order.price else {
            return Err(PlaceOrderErr::MissingPrice);
        };

        match order.side {
            Side::Ask => {
                let mut order_quantity = order.quantity;
                let mut empty_queue: Vec<Price> = Vec::new();
                for (price, queue) in book.bids.range_mut(price..).rev() {
                    if order_quantity == 0 {
                        break;
                    }
                    while order_quantity > 0 && !queue.is_empty() {
                        let bid = queue.front_mut().unwrap();
                        if bid.user_id == order.user_id {
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
                        }
                        if bid.quantity > order_quantity {
                            bid.quantity -= order_quantity;
                            outcome.fills.push(Fill {
                                price: *price,
                                quantity: order_quantity,
                                maker_user_id: bid.user_id.clone(),
                                maker_client_order_id: bid.client_order_id.clone(),
                            });
                            order_quantity = 0
                        } else {
                            order_quantity -= bid.quantity;
                            outcome.fills.push(Fill {
                                price: *price,
                                quantity: bid.quantity,
                                maker_user_id: bid.user_id.clone(),
                                maker_client_order_id: bid.client_order_id.clone(),
                            });

                            let popped = queue.pop_front().unwrap();
                            book.cancel_index
                                .remove(&(popped.user_id, popped.client_order_id));
                        }
                    }
                    if queue.is_empty() {
                        empty_queue.push(*price);
                    }
                }

                if order_quantity > 0 {
                    outcome.leftover = Leftover::Cancelled {
                        quantity: order_quantity,
                    };
                }

                for price in empty_queue {
                    book.bids.remove(&price);
                }
            }

            Side::Bid => {
                let mut order_quantity = order.quantity;
                let mut empty_queue: Vec<Price> = Vec::new();
                for (price, queue) in book.asks.range_mut(..=price) {
                    if order_quantity == 0 {
                        break;
                    }
                    while order_quantity > 0 && !queue.is_empty() {
                        let ask = queue.front_mut().unwrap();
                        if ask.user_id == order.user_id {
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
                        }
                        if ask.quantity > order_quantity {
                            ask.quantity -= order_quantity;
                            outcome.fills.push(Fill {
                                price: *price,
                                quantity: order_quantity,
                                maker_user_id: ask.user_id.clone(),
                                maker_client_order_id: ask.client_order_id.clone(),
                            });
                            order_quantity = 0
                        } else {
                            order_quantity -= ask.quantity;
                            outcome.fills.push(Fill {
                                price: *price,
                                quantity: ask.quantity,
                                maker_user_id: ask.user_id.clone(),
                                maker_client_order_id: ask.client_order_id.clone(),
                            });

                            let popped = queue.pop_front().unwrap();
                            book.cancel_index
                                .remove(&(popped.user_id, popped.client_order_id));
                        }
                    }
                    if queue.is_empty() {
                        empty_queue.push(*price);
                    }
                }

                if order_quantity > 0 {
                    outcome.leftover = Leftover::Cancelled {
                        quantity: order_quantity,
                    };
                }
                for price in empty_queue {
                    book.asks.remove(&price);
                }
            }
        }
        Ok(outcome)
    }
}
