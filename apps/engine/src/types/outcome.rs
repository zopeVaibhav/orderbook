use serde::Serialize;

use crate::types::{
    aliases::{ClientOrderId, Price, Quantity, UserId},
    order::Side,
};

#[derive(Serialize)]
pub struct PlaceOrderOutcome {
    pub(crate) ts: u64,
    pub(crate) fills: Vec<Fill>,
    pub(crate) leftover: Leftover,
    pub(crate) stp_cancellations: Vec<StpCancellation>,
    pub(crate) level_changes: Vec<LevelChange>,
}

impl PlaceOrderOutcome {
    pub fn new() -> Self {
        Self {
            ts: Self::now_ms(),
            fills: Vec::new(),
            leftover: Leftover::None,
            stp_cancellations: Vec::new(),
            level_changes: Vec::new(),
        }
    }

    pub fn now_ms() -> u64 {
        use std::time::{SystemTime, UNIX_EPOCH};
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0)
    }
}

#[derive(Serialize)]
pub struct Fill {
    pub(crate) price: Price,
    pub(crate) quantity: Quantity,
    pub(crate) maker_user_id: UserId,
    pub(crate) maker_client_order_id: ClientOrderId,
}

#[derive(Serialize)]
pub enum Leftover {
    None,
    Rested { price: Price, quantity: Quantity },
    Cancelled { quantity: Quantity },
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

#[derive(Serialize)]
pub enum PlaceOrderErr {
    UnknownMarket,
    BelowMinQuantity,
    MissingPrice,
    PostOnlyWouldCross,
    FillOrKillUnfillable,
}

#[derive(Serialize)]
pub struct CancelOrderOutcome {
    pub(crate) side: Side,
    pub(crate) price: Price,
    pub(crate) quantity: Quantity,
}

#[derive(Serialize)]
pub enum CancelOrderErr {
    UnknownMarket,
    OrderNotFound,
}
