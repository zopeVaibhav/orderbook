use crate::types::{
    Leftover, LevelChange, MarketState, NewOrderPayload, PlaceOrderErr, PlaceOrderOutcome,
};

impl MarketState {
    pub fn place_limit_order(
        &mut self,
        order: &NewOrderPayload,
    ) -> Result<PlaceOrderOutcome, PlaceOrderErr> {
        let Some(price) = order.price else {
            return Err(PlaceOrderErr::MissingPrice);
        };

        let mut outcome = PlaceOrderOutcome::default();

        let remaining_quantity = self.match_against(
            order.side.opposite(),
            order.price,
            &order.user_id,
            order.quantity,
            &mut outcome,
        );

        if remaining_quantity > 0 {
            let new_quantity = self.rest_on_book(order.side, price, order, remaining_quantity);
            outcome.leftover = Leftover::Rested {
                price,
                quantity: remaining_quantity,
            };
            outcome.level_changes.push(LevelChange {
                price,
                side: order.side,
                new_quantity,
            });
        }
        Ok(outcome)
    }
}
