use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct MarketRegisteredPayload {
    pub market_id: String,
    pub tick_exp: u8,
    pub lot_exp: u8,
    pub min_quantity: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum MarketControlEvent {
    MarketRegistered(MarketRegisteredPayload),
}
