use crate::types::{market::MarketState, order::Side, payload::CancelOrderPayload};
impl MarketState {
    pub fn cancel_order(&mut self, order: &CancelOrderPayload) -> bool {
        let book = &mut self.book;
        let key = (order.user_id.clone(), order.client_order_id.clone());

        let Some((side, price)) = book.cancel_index.remove(&key) else {
            return false;
        };

        let level = match side {
            Side::Ask => book.asks.get_mut(&price),
            Side::Bid => book.bids.get_mut(&price),
        };

        let Some(queue) = level else {
            return false;
        };

        let Some(pos) = queue
            .iter()
            .position(|o| o.client_order_id == order.client_order_id && o.user_id == order.user_id)
        else {
            return false;
        };

        queue.remove(pos);

        if queue.is_empty() {
            match side {
                Side::Ask => book.asks.remove(&price),
                Side::Bid => book.bids.remove(&price),
            };
        };

        true
    }
}
