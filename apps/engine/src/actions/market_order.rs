use crate::types::{
    aliases::Price,
    engine::MarketState,
    order::Side,
    outcome::{Fill, Leftover, PlaceOrderErr, PlaceOrderOutcome, StpCancellation},
    payload::NewOrderPayload,
};

impl MarketState {
    pub fn place_market_order(
        &mut self,
        order: &NewOrderPayload,
    ) -> Result<PlaceOrderOutcome, PlaceOrderErr> {
        let book = &mut self.book;

        let mut outcome = PlaceOrderOutcome {
            fills: Vec::new(),
            leftover: Leftover::None,
            stp_cancellations: Vec::new(),
        };

        match order.side {
            Side::Ask => {
                let mut remaining_quantity = order.quantity;
                let mut empty_queue: Vec<Price> = Vec::new();
                for (price, queue) in book.bids.iter_mut().rev() {
                    if remaining_quantity == 0 {
                        break;
                    }
                    while remaining_quantity > 0 && !queue.is_empty() {
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
                            book.cancel_index
                                .remove(&(popped.user_id, popped.client_order_id));
                        }
                    }
                    if queue.is_empty() {
                        empty_queue.push(*price);
                    }
                }

                if remaining_quantity > 0 {
                    outcome.leftover = Leftover::Cancelled {
                        quantity: remaining_quantity,
                    }
                }

                for key in empty_queue {
                    book.bids.remove(&key);
                }
            }
            Side::Bid => {
                let mut remaining_quantity = order.quantity;
                let mut empty_queue: Vec<Price> = Vec::new();

                for (price, queue) in book.asks.iter_mut() {
                    if remaining_quantity == 0 {
                        break;
                    }
                    while remaining_quantity > 0 && !queue.is_empty() {
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
                            book.cancel_index
                                .remove(&(popped.user_id, popped.client_order_id));
                        }
                    }
                    if queue.is_empty() {
                        empty_queue.push(*price);
                    }
                }
                if remaining_quantity > 0 {
                    outcome.leftover = Leftover::Cancelled {
                        quantity: remaining_quantity,
                    };
                }

                for key in empty_queue {
                    book.asks.remove(&key);
                }
            }
        };
        Ok(outcome)
    }
}
