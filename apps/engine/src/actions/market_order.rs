use crate::types::{
    market::MarketState,
    outcome::{Leftover, PlaceOrderErr, PlaceOrderOutcome},
    payload::NewOrderPayload,
};

impl MarketState {
    pub fn place_market_order(
        &mut self,
        order: &NewOrderPayload,
    ) -> Result<PlaceOrderOutcome, PlaceOrderErr> {
        if order.price.is_some() {
            return Err(PlaceOrderErr::MarketOrderWithPrice);
        }
        let mut outcome = PlaceOrderOutcome::default();
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
