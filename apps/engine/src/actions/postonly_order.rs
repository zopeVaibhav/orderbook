use crate::types::{
    engine::MarketState,
    order::{Order, Side},
    payload::NewOrderPayload,
};

impl MarketState {
    pub fn place_postonly_order(&mut self, order: &NewOrderPayload) -> bool {
        let market = &self.market;
        let book = &mut self.book;

        let Some(price) = order.price else {
            return false;
        };

        if order.quantity < market.min_quantity {
            return false;
        };

        match order.side {
            Side::Ask => {
                if book.bids.keys().next_back().is_some_and(|&b| b >= price) {
                    return false;
                }
                book.asks.entry(price).or_default().push_back(Order {
                    client_order_id: order.client_order_id.clone(),
                    user_id: order.user_id.clone(),
                    quantity: order.quantity,
                });
                book.cancel_index.insert(
                    (order.user_id.clone(), order.client_order_id.clone()),
                    (Side::Ask, price),
                );
            }
            Side::Bid => {
                if book.asks.keys().next().is_some_and(|&a| a <= price) {
                    return false;
                }
                book.bids.entry(price).or_default().push_back(Order {
                    client_order_id: order.client_order_id.clone(),
                    user_id: order.user_id.clone(),
                    quantity: order.quantity,
                });
                book.cancel_index.insert(
                    (order.user_id.clone(), order.client_order_id.clone()),
                    (Side::Bid, price),
                );
            }
        }

        true
    }
}
