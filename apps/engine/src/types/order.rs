use crate::types::aliases::{ClientOrderId, Quantity, UserId};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Order {
    client_order_id: ClientOrderId,
    user_id: UserId,
    quantity: Quantity,
}

impl Order {
    pub fn new(client_order_id: ClientOrderId, user_id: UserId, quantity: Quantity) -> Self {
        Self {
            client_order_id,
            user_id,
            quantity,
        }
    }

    pub fn client_order_id(&self) -> &str {
        &self.client_order_id
    }

    pub fn user_id(&self) -> &str {
        &self.user_id
    }

    pub fn quantity(&self) -> Quantity {
        self.quantity
    }

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
