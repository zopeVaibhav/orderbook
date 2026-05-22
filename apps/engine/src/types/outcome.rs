use serde::Serialize;

use crate::types::{
    aliases::{ClientOrderId, Price, Quantity, UserId},
    order::Side,
};

#[derive(Serialize, Default)]
pub struct PlaceOrderOutcome {
    pub(crate) fills: Vec<Fill>,
    pub(crate) leftover: Leftover,
    pub(crate) stp_cancellations: Vec<StpCancellation>,
    pub(crate) level_changes: Vec<LevelChange>,
}

#[derive(Serialize)]
pub struct Fill {
    pub(crate) price: Price,
    pub(crate) quantity: Quantity,
    pub(crate) maker_user_id: UserId,
    pub(crate) maker_client_order_id: ClientOrderId,
}

#[derive(Serialize, Default)]
pub enum Leftover {
    #[default]
    None,
    Rested {
        price: Price,
        quantity: Quantity,
    },
    Cancelled {
        quantity: Quantity,
    },
}

#[derive(Serialize)]
pub struct StpCancellation {
    pub(crate) price: Price,
    pub(crate) quantity: Quantity,
    pub(crate) maker_user_id: UserId,
    pub(crate) maker_client_order_id: ClientOrderId,
}

#[derive(Serialize)]
pub struct LevelChange {
    pub(crate) side: Side,
    pub(crate) price: Price,
    pub(crate) new_quantity: Quantity,
}

#[derive(Debug, Serialize)]
pub enum PlaceOrderErr {
    UnknownMarket,
    BelowMinQuantity,
    MissingPrice,
    PostOnlyWouldCross,
    FillOrKillUnfillable,
    MarketOrderWithPrice,
}

#[derive(Debug, Serialize)]
pub struct CancelOrderOutcome {
    pub(crate) side: Side,
    pub(crate) price: Price,
    pub(crate) cancelled_quantity: Quantity,
    pub(crate) new_level_quantity: Quantity,
}

#[derive(Debug, Serialize)]
pub enum CancelOrderErr {
    UnknownMarket,
    OrderNotFound,
}
