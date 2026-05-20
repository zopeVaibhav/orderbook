use crate::types::{
    market::MarketState,
    outcome::{Leftover, PlaceOrderErr, PlaceOrderOutcome},
    payload::NewOrderPayload,
};

impl MarketState {
    pub fn place_postonly_order(
        &mut self,
        order: &NewOrderPayload,
    ) -> Result<PlaceOrderOutcome, PlaceOrderErr> {
        let Some(price) = order.price else {
            return Err(PlaceOrderErr::MissingPrice);
        };

        if self.would_cross(order.side, price) {
            return Err(PlaceOrderErr::PostOnlyWouldCross);
        }

        let mut outcome = PlaceOrderOutcome {
            fills: Vec::new(),
            leftover: Leftover::None,
            stp_cancellations: Vec::new(),
        };

        self.rest_on_book(order.side, price, order, order.quantity);

        outcome.leftover = Leftover::Rested {
            price,
            quantity: order.quantity,
        };

        Ok(outcome)
    }
}
