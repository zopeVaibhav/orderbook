#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Order {
    client_order_id: String,
    user_id: String,
    quantity: u64,
}

impl Order {
    pub fn new(client_order_id: String, user_id: String, quantity: u64) -> Self {
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

    pub fn quantity(&self) -> u64 {
        self.quantity
    }

    pub fn into_id_pair(self) -> (String, String) {
        (self.user_id, self.client_order_id)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Tif {
    Gtc,
    Ioc,
    Fok,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Side {
    Ask,
    Bid,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OrderType {
    Limit,
    Market,
}
