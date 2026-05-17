use crate::types::order::{Order, Side};
use std::collections::{BTreeMap, HashMap, VecDeque};

#[derive(Debug, Default)]
pub struct Book {
    asks: BTreeMap<u64, VecDeque<Order>>,
    bids: BTreeMap<u64, VecDeque<Order>>,
    cancel_index: HashMap<(String, String), (Side, u64)>,
}

impl Book {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn asks(&self) -> &BTreeMap<u64, VecDeque<Order>> {
        &self.asks
    }

    pub fn bids(&self) -> &BTreeMap<u64, VecDeque<Order>> {
        &self.bids
    }

    pub fn cancel_index(&self) -> &HashMap<(String, String), (Side, u64)> {
        &self.cancel_index
    }
}
