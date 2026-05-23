use crate::types::{
    Leftover, LevelChange, MarketState, NewOrderPayload, PlaceOrderErr, PlaceOrderOutcome,
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

        let mut outcome = PlaceOrderOutcome::default();
        let new_quantity = self.rest_on_book(order.side, price, order, order.quantity);

        outcome.leftover = Leftover::Rested {
            price,
            quantity: order.quantity,
        };

        outcome.level_changes.push(LevelChange {
            side: order.side,
            price,
            new_quantity,
        });

        Ok(outcome)
    }
}
