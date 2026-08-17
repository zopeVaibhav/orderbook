export type MarketCategory = 'markets' | 'follows';

export type Market = {
    symbol: string;
    name: string;
    iconSrc?: string;
    price: number;
    change24h: number;
    leverage?: number;
    category: MarketCategory;
};
