use crate::types::{CancelOrderPayload, NewOrderPayload};
use serde::Deserialize;

#[derive(Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum IncomingOrder {
    NewOrder(NewOrderPayload),
    CancelOrder(CancelOrderPayload),
}
