pub struct NewOrderPayload {
    pub client_order_id: String,
    pub user_id: String,
    pub market_id: String,
    pub side: Side,
    pub order_type: OrderType,
    pub price: u64,
    pub quantity: u64,
    pub tif: Tif,
    pub post_only: bool,
}

pub struct CancelOrderPayload {
    pub client_order_id: String,
    pub user_id: String,
    pub market_id: String,
}

pub struct Order {
    pub client_order_id: String,
    pub user_id: String,
    pub quantity: u64,
}

pub enum Tif {
    Gtc,
    Ioc,
    Fok,
}

pub enum Side {
    Ask,
    Bid,
}

pub enum OrderType {
    Limit,
    Market,
}
