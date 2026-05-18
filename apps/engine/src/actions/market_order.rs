use crate::types::{aliases::Price, engine::MarketState, order::Side, payload::NewOrderPayload};

impl MarketState {
    pub fn place_market_order(&mut self, order: &NewOrderPayload) -> bool {
        let market = &self.market;
        let book = &mut self.book;

        if order.quantity < market.min_quantity {
            return false;
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
                            let popped = queue.pop_front().unwrap();
                            book.cancel_index
                                .remove(&(popped.user_id, popped.client_order_id));
                            continue;
                        };
                        if bid.quantity > remaining_quantity {
                            bid.quantity -= remaining_quantity;
                            remaining_quantity = 0;
                        } else {
                            remaining_quantity -= bid.quantity;
                            let popped = queue.pop_front().unwrap();
                            book.cancel_index
                                .remove(&(popped.user_id, popped.client_order_id));
                        }
                    }
                    if queue.is_empty() {
                        empty_queue.push(*price);
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
                            let popped = queue.pop_front().unwrap();
                            book.cancel_index
                                .remove(&(popped.user_id, popped.client_order_id));
                            continue;
                        }

                        if ask.quantity > remaining_quantity {
                            ask.quantity -= remaining_quantity;
                            remaining_quantity = 0;
                        } else {
                            remaining_quantity -= ask.quantity;
                            let popped = queue.pop_front().unwrap();
                            book.cancel_index
                                .remove(&(popped.user_id, popped.client_order_id));
                        }
                    }
                    if queue.is_empty() {
                        empty_queue.push(*price);
                    }
                }
                for key in empty_queue {
                    book.asks.remove(&key);
                }
            }
        };

        true
    }
}
