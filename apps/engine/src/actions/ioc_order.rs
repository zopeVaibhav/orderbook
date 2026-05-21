use crate::types::{
    market::MarketState,
    outcome::{Leftover, PlaceOrderErr, PlaceOrderOutcome},
    payload::NewOrderPayload,
};

impl MarketState {
    pub fn place_ioc_order(
        &mut self,
        order: &NewOrderPayload,
    ) -> Result<PlaceOrderOutcome, PlaceOrderErr> {
        let mut outcome = PlaceOrderOutcome::new();
        let Some(_) = order.price else {
            return Err(PlaceOrderErr::MissingPrice);
        };

        let remaining_quantity = self.match_against(
            order.side.opposite(),
            order.price,
            &order.user_id,
            order.quantity,
            &mut outcome,
        );

        if remaining_quantity > 0 {
            outcome.leftover = Leftover::Cancelled {
                quantity: remaining_quantity,
            }
        };
        Ok(outcome)
    }
}
