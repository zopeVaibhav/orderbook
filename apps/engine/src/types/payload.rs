use super::order::{OrderType, Side, Tif};

#[derive(Debug, Clone)]
pub struct NewOrderPayload {
    client_order_id: String,
    user_id: String,
    market_id: String,
    side: Side,
    order_type: OrderType,
    price: u64,
    quantity: u64,
    tif: Tif,
    post_only: bool,
}

impl NewOrderPayload {
    #![allow(clippy::too_many_arguments)]
    pub fn new(
        client_order_id: String,
        user_id: String,
        market_id: String,
        side: Side,
        order_type: OrderType,
        price: u64,
        quantity: u64,
        tif: Tif,
        post_only: bool,
    ) -> Self {
        Self {
            client_order_id,
            user_id,
            market_id,
            side,
            order_type,
            price,
            quantity,
            tif,
            post_only,
        }
    }

    pub fn client_order_id(&self) -> &str {
        &self.client_order_id
    }

    pub fn user_id(&self) -> &str {
        &self.user_id
    }

    pub fn market_id(&self) -> &str {
        &self.market_id
    }

    pub fn side(&self) -> Side {
        self.side
    }

    pub fn order_type(&self) -> OrderType {
        self.order_type
    }

    pub fn price(&self) -> u64 {
        self.price
    }

    pub fn quantity(&self) -> u64 {
        self.quantity
    }

    pub fn tif(&self) -> Tif {
        self.tif
    }

    pub fn post_only(&self) -> bool {
        self.post_only
    }
}

#[derive(Debug, Clone)]
pub struct CancelOrderPayload {
    client_order_id: String,
    user_id: String,
    market_id: String,
}

impl CancelOrderPayload {
    pub fn new(client_order_id: String, user_id: String, market_id: String) -> Self {
        Self {
            client_order_id,
            user_id,
            market_id,
        }
    }

    pub fn client_order_id(&self) -> &str {
        &self.client_order_id
    }

    pub fn user_id(&self) -> &str {
        &self.user_id
    }

    pub fn market_id(&self) -> &str {
        &self.market_id
    }
}
