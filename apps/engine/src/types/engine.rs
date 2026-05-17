use super::{aliases::MarketId, book::Book, market::Market};
use std::collections::HashMap;

#[derive(Debug)]
pub struct MarketState {
    pub(crate) market: Market,
    pub(crate) book: Book,
}

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
}
