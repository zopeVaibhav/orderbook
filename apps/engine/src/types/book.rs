use std::collections::{BTreeMap, HashMap, VecDeque};

use crate::types::order::{Order, Side};

pub struct Book {
    pub asks: BTreeMap<u64, VecDeque<Order>>,
    pub bids: BTreeMap<u64, VecDeque<Order>>,
    pub cancel_index: HashMap<(String, String), (Side, u64)>,
}

impl Book {
    pub fn place_limit_order() {}
}
