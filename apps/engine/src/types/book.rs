use super::{
    aliases::{ClientOrderId, Price, UserId},
    order::{Order, Side},
};
use std::collections::{BTreeMap, HashMap, VecDeque};

#[derive(Debug, Default)]
pub struct Book {
    pub(crate) asks: BTreeMap<Price, VecDeque<Order>>,
    pub(crate) bids: BTreeMap<Price, VecDeque<Order>>,
    pub(crate) cancel_index: HashMap<(UserId, ClientOrderId), (Side, Price)>,
}

impl Book {
    pub fn side_mut(&mut self, side: Side) -> &mut BTreeMap<Price, VecDeque<Order>> {
        match side {
            Side::Ask => &mut self.asks,
            Side::Bid => &mut self.bids,
        }
    }
}
