use serde::{Deserialize, Serialize};

use crate::types::aliases::{ClientOrderId, Quantity, UserId};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
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

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Deserialize, Serialize)]
pub enum Side {
    Ask,
    Bid,
}

impl Side {
    pub fn opposite(self) -> Side {
        match self {
            Side::Ask => Side::Bid,
            Side::Bid => Side::Ask,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
pub enum OrderKind {
    LimitGtc,
    Market,
    Ioc,
    Fok,
    PostOnly,
}
