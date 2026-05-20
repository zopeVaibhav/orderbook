use crate::types::{
    engine::MarketState,
    order::{Order, Side},
    outcome::{Leftover, PlaceOrderErr, PlaceOrderOutcome},
    payload::NewOrderPayload,
};

impl MarketState {
    pub fn place_postonly_order(
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
                if book.bids.keys().next_back().is_some_and(|&b| b >= price) {
                    return Err(PlaceOrderErr::PostOnlyWouldCross);
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
                    return Err(PlaceOrderErr::PostOnlyWouldCross);
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

        outcome.leftover = Leftover::Rested {
            price,
            quantity: order.quantity,
        };

        Ok(outcome)
    }
}
