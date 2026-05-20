use super::{
    aliases::MarketId,
    book::Book,
    market::Market,
    market::MarketState,
    order::OrderKind,
    outcome::{PlaceOrderErr, PlaceOrderOutcome},
    payload::{CancelOrderPayload, NewOrderPayload},
};
use std::collections::HashMap;

#[derive(Debug, Default)]
pub struct Engine {
    pub(crate) markets: HashMap<MarketId, MarketState>,
}

impl Engine {
    pub fn add_market(&mut self, market_id: MarketId, market: Market) {
        self.markets.insert(
            market_id,
            MarketState {
                market,
                book: Book::default(),
            },
        );
    }

    pub fn submit_new_order(
        &mut self,
        order: NewOrderPayload,
    ) -> Result<PlaceOrderOutcome, PlaceOrderErr> {
        let Some(market_state) = self.markets.get_mut(&order.market_id) else {
            return Err(PlaceOrderErr::UnknownMarket);
        };

        if order.quantity < market_state.market.min_quantity {
            return Err(PlaceOrderErr::BelowMinQuantity);
        }

        match order.order_kind {
            OrderKind::LimitGtc => market_state.place_limit_order(&order),
            OrderKind::Market => market_state.place_market_order(&order),
            OrderKind::Ioc => market_state.place_ioc_order(&order),
            OrderKind::Fok => market_state.place_fok_order(&order),
            OrderKind::PostOnly => market_state.place_postonly_order(&order),
        }
    }

    pub fn submit_cancel(&mut self, order: CancelOrderPayload) -> bool {
        let Some(market_state) = self.markets.get_mut(&order.market_id) else {
            return false;
        };
        market_state.cancel_order(&order)
    }
}
