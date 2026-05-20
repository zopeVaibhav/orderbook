use crate::types::{
    market::MarketState,
    outcome::{Leftover, PlaceOrderErr, PlaceOrderOutcome},
    payload::NewOrderPayload,
};

impl MarketState {
    pub fn place_limit_order(
        &mut self,
        order: &NewOrderPayload,
    ) -> Result<PlaceOrderOutcome, PlaceOrderErr> {
        let mut outcome = PlaceOrderOutcome {
            fills: Vec::new(),
            leftover: Leftover::None,
            stp_cancellations: Vec::new(),
        };

        let Some(price) = order.price else {
            return Err(PlaceOrderErr::MissingPrice);
        };

        let remaining_quantity = self.match_against(
            &order.side.opposite(),
            order.price,
            &order.user_id,
            order.quantity,
            &mut outcome,
        );

        if remaining_quantity > 0 {
            self.rest_on_book(order.side, price, order, remaining_quantity);
            outcome.leftover = Leftover::Rested {
                price,
                quantity: remaining_quantity,
            };
        }
        Ok(outcome)
    }
}
