use super::aliases::{ClientOrderId, MarketId, Price, Quantity, UserId};
use super::order::{OrderKind, Side};

#[derive(Debug, Clone)]
pub struct NewOrderPayload {
    client_order_id: ClientOrderId,
    user_id: UserId,
    market_id: MarketId,
    side: Side,
    order_kind: OrderKind,
    price: Option<Price>,
    quantity: Quantity,
}

impl NewOrderPayload {
    pub fn new(
        client_order_id: ClientOrderId,
        user_id: UserId,
        market_id: MarketId,
        side: Side,
        order_kind: OrderKind,
        price: Option<Price>,
        quantity: Quantity,
    ) -> Self {
        Self {
            client_order_id,
            user_id,
            market_id,
            side,
            order_kind,
            price,
            quantity,
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

    pub fn order_kind(&self) -> OrderKind {
        self.order_kind
    }

    pub fn price(&self) -> Option<Price> {
        self.price
    }

    pub fn quantity(&self) -> Quantity {
        self.quantity
    }
}

#[derive(Debug, Clone)]
pub struct CancelOrderPayload {
    client_order_id: ClientOrderId,
    user_id: UserId,
    market_id: MarketId,
}

impl CancelOrderPayload {
    pub fn new(client_order_id: ClientOrderId, user_id: UserId, market_id: MarketId) -> Self {
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
