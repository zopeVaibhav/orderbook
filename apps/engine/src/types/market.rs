#[derive(Debug, Clone)]
pub struct Market {
    pub(crate) tick_exp: u8,
    pub(crate) lot_exp: u8,
    pub(crate) min_qty: u64,
}
