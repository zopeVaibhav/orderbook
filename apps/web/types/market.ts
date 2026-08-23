export type MarketCategory = 'markets' | 'follows';

export type ApiMarket = {
    id: string;
    base: string;
    quote: string;
    tickExp: number;
    lotExp: number;
    minQuantity: string;
    makerFeeBps: number;
    takerFeeBps: number;
    baseRef: { name: string; decimals: number };
    quoteRef: { name: string; decimals: number };
};

export type Market = {
    id: string;
    slug: string;
    symbol: string;
    name: string;
    quote: string;
    iconSrc?: string;
    tickExp: number;
    lotExp: number;
    minQuantity: string;
    makerFeeBps: number;
    takerFeeBps: number;
    baseDecimals: number;
    quoteDecimals: number;
    price?: number;
    change24h?: number;
};
