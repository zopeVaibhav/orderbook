export type MarketCategory = 'markets' | 'follows';

export type ApiMarket = {
    id: string;
    base: string;
    quote: string;
    tickExp: number;
    lotExp: number;
    minQuantity: string;
    makerEnabled: boolean;
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
    baseDecimals: number;
    quoteDecimals: number;
    makerEnabled: boolean;
    price?: number;
    change24h?: number;
};

export type MarketStats = {
    marketId: string;
    lastPrice: string;
    openPrice: string;
    change24h: number;
    volume24h: string;
};
