use crate::types::{
    market::MarketState,
    order::Side,
    outcome::{PlaceOrderErr, PlaceOrderOutcome},
    payload::NewOrderPayload,
};

impl MarketState {
    pub fn place_fok_order(
        &mut self,
        order: &NewOrderPayload,
    ) -> Result<PlaceOrderOutcome, PlaceOrderErr> {
        let book = &self.book;

        let Some(price) = order.price else {
            return Err(PlaceOrderErr::MissingPrice);
        };

        let available: u64 = match order.side {
            Side::Ask => {
                let mut sum: u64 = 0;
                'outer: for (_, queue) in book.bids.range(price..).rev() {
                    for resting in queue.iter() {
                        if resting.user_id == order.user_id {
                            continue;
                        }
                        sum = sum.saturating_add(resting.quantity);
                        if sum >= order.quantity {
                            break 'outer;
                        }
                    }
                }
                sum
            }
            Side::Bid => {
                let mut sum: u64 = 0;
                'outer: for (_, queue) in book.asks.range(..=price) {
                    for resting in queue.iter() {
                        if resting.user_id == order.user_id {
                            continue;
                        }
                        sum = sum.saturating_add(resting.quantity);
                        if sum >= order.quantity {
                            break 'outer;
                        }
                    }
                }
                sum
            }
        };
        if available < order.quantity {
            return Err(PlaceOrderErr::FillOrKillUnfillable);
        }

        let mut outcome = PlaceOrderOutcome::default();
        let remaining_quantity = self.match_against(
            order.side.opposite(),
            order.price,
            &order.user_id,
            order.quantity,
            &mut outcome,
        );

        debug_assert!(remaining_quantity == 0);

        Ok(outcome)
    }
}
