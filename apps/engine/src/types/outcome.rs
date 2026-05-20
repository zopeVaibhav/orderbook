use crate::types::aliases::{ClientOrderId, Price, Quantity, UserId};

pub struct PlaceOrderOutcome {
    pub(crate) fills: Vec<Fill>,
    pub(crate) leftover: Leftover,
    pub(crate) stp_cancellations: Vec<StpCancellation>,
}

pub struct Fill {
    pub(crate) price: Price,
    pub(crate) quantity: Quantity,
    pub(crate) maker_user_id: UserId,
    pub(crate) maker_client_order_id: ClientOrderId,
}

pub enum Leftover {
    None,
    Rested { price: Price, quantity: Quantity },
    Cancelled { quantity: Quantity },
}

pub struct StpCancellation {
    pub(crate) price: Price,
    pub(crate) quantity: Quantity,
    pub(crate) maker_user_id: UserId,
    pub(crate) maker_client_order_id: ClientOrderId,
}

pub enum PlaceOrderErr {
    UnknownMarket,
    BelowMinQuantity,
    MissingPrice,
    PostOnlyWouldCross,
    FillOrKillUnfillable,
}
