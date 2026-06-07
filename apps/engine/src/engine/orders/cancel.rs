use crate::engine::{
    CancelOrderErr, CancelOrderOutcome, CancelOrderPayload, MarketState, Quantity, Side,
};

impl MarketState {
    pub fn cancel_order(
        &mut self,
        order: &CancelOrderPayload,
    ) -> Result<CancelOrderOutcome, CancelOrderErr> {
        let book = &mut self.book;

        let key = (order.user_id.clone(), order.client_order_id.clone());

        let Some(&(side, price)) = book.cancel_index.get(&key) else {
            return Err(CancelOrderErr::OrderNotFound);
        };

        let level = match side {
            Side::Ask => book.asks.get_mut(&price),
            Side::Bid => book.bids.get_mut(&price),
        };

        let Some(queue) = level else {
            return Err(CancelOrderErr::OrderNotFound);
        };

        let Some(pos) = queue
            .iter()
            .position(|o| o.client_order_id == order.client_order_id && o.user_id == order.user_id)
        else {
            return Err(CancelOrderErr::OrderNotFound);
        };

        let total_level_quantity: Quantity = queue.iter().map(|v| v.quantity).sum();
        let cancelled_quantity = queue[pos].quantity;
        let outcome = CancelOrderOutcome {
            price,
            side,
            cancelled_quantity,
            new_level_quantity: total_level_quantity - cancelled_quantity,
        };

        queue.remove(pos);
        book.cancel_index.remove(&key);

        if queue.is_empty() {
            match side {
                Side::Ask => book.asks.remove(&price),
                Side::Bid => book.bids.remove(&price),
            };
        };
        Ok(outcome)
    }
}
