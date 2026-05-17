#[derive(Debug, Clone)]
pub struct Market {
    tick_exp: u8,
    lot_exp: u8,
    min_qty: u64,
}

impl Market {
    pub fn new(tick_exp: u8, lot_exp: u8, min_qty: u64) -> Self {
        Self {
            tick_exp,
            lot_exp,
            min_qty,
        }
    }

    pub fn tick_exp(&self) -> u8 {
        self.tick_exp
    }

    pub fn lot_exp(&self) -> u8 {
        self.lot_exp
    }

    pub fn min_qty(&self) -> u64 {
        self.min_qty
    }
}
