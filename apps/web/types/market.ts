export type { ApiMarket, MarketStats } from '@repo/types';

export type MarketCategory = 'markets' | 'follows';

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
    volume24h?: number;
};
