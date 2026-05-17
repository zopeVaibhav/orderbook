use super::{aliases::MarketId, book::Book, market::Market};
use std::collections::HashMap;

#[derive(Debug)]
pub struct MarketState {
    market: Market,
    book: Book,
}

impl MarketState {
    pub fn new(market: Market, book: Book) -> Self {
        Self { market, book }
    }

    pub fn market(&self) -> &Market {
        &self.market
    }

    pub fn book(&self) -> &Book {
        &self.book
    }
}

#[derive(Debug, Default)]
pub struct Engine {
    markets: HashMap<MarketId, MarketState>,
}

impl Engine {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn markets(&self) -> &HashMap<MarketId, MarketState> {
        &self.markets
    }

    pub fn add_market(&mut self, market_id: MarketId, market: Market) {
        self.markets
            .insert(market_id, MarketState::new(market, Book::new()));
    }
}
