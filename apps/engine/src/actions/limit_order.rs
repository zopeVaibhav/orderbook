use crate::types::{
    aliases::Price,
    engine::MarketState,
    order::{Order, Side},
    payload::NewOrderPayload,
};

impl MarketState {
    pub fn place_limit_order(&mut self, order: &NewOrderPayload) -> bool {
        let book = &mut self.book;
        let market = &self.market;
        let Some(price) = order.price else {
            return false;
        };
        if order.quantity < market.min_quantity {
            return false;
        }
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
                            let popped = queue.pop_front().unwrap();
                            book.cancel_index
                                .remove(&(popped.user_id, popped.client_order_id));
                            continue;
                        }
                        if bid.quantity > order_quantity {
                            bid.quantity -= order_quantity;
                            order_quantity = 0
                        } else {
                            order_quantity -= bid.quantity;
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
                    book.asks.entry(price).or_default().push_back(Order {
                        client_order_id: order.client_order_id.clone(),
                        user_id: order.user_id.clone(),
                        quantity: order_quantity,
                    });
                    book.cancel_index.insert(
                        (order.user_id.clone(), order.client_order_id.clone()),
                        (Side::Ask, price),
                    );
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
                            let popped = queue.pop_front().unwrap();
                            book.cancel_index
                                .remove(&(popped.user_id, popped.client_order_id));
                            continue;
                        }
                        if ask.quantity > order_quantity {
                            ask.quantity -= order_quantity;
                            order_quantity = 0
                        } else {
                            order_quantity -= ask.quantity;
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
                    book.bids.entry(price).or_default().push_back(Order {
                        client_order_id: order.client_order_id.clone(),
                        user_id: order.user_id.clone(),
                        quantity: order_quantity,
                    });
                    book.cancel_index.insert(
                        (order.user_id.clone(), order.client_order_id.clone()),
                        (Side::Bid, price),
                    );
                }

                for price in empty_queue {
                    book.asks.remove(&price);
                }
            }
        }
        true
    }
}
