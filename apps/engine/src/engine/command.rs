use serde::Deserialize;

use crate::engine::{ClientOrderId, MarketId, OrderKind, Price, Quantity, Side, UserId};

#[derive(Debug, Clone, Deserialize)]
pub struct NewOrderPayload {
    pub(crate) client_order_id: ClientOrderId,
    pub(crate) user_id: UserId,
    pub(crate) market_id: MarketId,
    pub(crate) side: Side,
    pub(crate) order_kind: OrderKind,
    pub(crate) price: Option<Price>,
    pub(crate) quantity: Quantity,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CancelOrderPayload {
    pub(crate) client_order_id: ClientOrderId,
    pub(crate) user_id: UserId,
    pub(crate) market_id: MarketId,
}
