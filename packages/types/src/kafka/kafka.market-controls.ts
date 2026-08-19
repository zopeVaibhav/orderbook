export interface MarketRegistered {
    market_id: string;
    tick_exp: number;
    lot_exp: number;
    min_quantity: string;
}

export type MarketControlEvent = { type: 'market_registered' } & MarketRegistered;
