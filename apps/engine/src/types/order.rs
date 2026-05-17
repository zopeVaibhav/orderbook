use crate::types::aliases::{ClientOrderId, Quantity, UserId};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Order {
    pub(crate) client_order_id: ClientOrderId,
    pub(crate) user_id: UserId,
    pub(crate) quantity: Quantity,
}

impl Order {
    pub fn into_id_pair(self) -> (UserId, ClientOrderId) {
        (self.user_id, self.client_order_id)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Side {
    Ask,
    Bid,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OrderKind {
    LimitGtc,
    Market,
    Ioc,
    Fok,
    PostOnly,
}
