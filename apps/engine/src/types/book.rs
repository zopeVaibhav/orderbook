use super::{
    aliases::{ClientOrderId, Price, UserId},
    order::{Order, Side},
};
use std::collections::{BTreeMap, HashMap, VecDeque};

#[derive(Debug, Default)]
pub struct Book {
    asks: BTreeMap<Price, VecDeque<Order>>,
    bids: BTreeMap<Price, VecDeque<Order>>,
    cancel_index: HashMap<(UserId, ClientOrderId), (Side, Price)>,
}

impl Book {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn asks(&self) -> &BTreeMap<Price, VecDeque<Order>> {
        &self.asks
    }

    pub fn bids(&self) -> &BTreeMap<Price, VecDeque<Order>> {
        &self.bids
    }

    pub fn cancel_index(&self) -> &HashMap<(UserId, ClientOrderId), (Side, Price)> {
        &self.cancel_index
    }
}
