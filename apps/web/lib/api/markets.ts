import type { ApiResponse } from '@repo/types';
import { apiClient } from '@/lib/axios';
import { MARKETS_URL } from '@/lib/api-routes';
import { marketIcon } from '@/lib/market/marketIcons';
import type { ApiMarket, Market } from '@/types/market';

function toMarket(m: ApiMarket): Market {
    return {
        id: m.id,
        slug: `${m.base}-${m.quote}`,
        symbol: m.base,
        name: m.baseRef.name,
        quote: m.quote,
        iconSrc: marketIcon(m.base),
        tickExp: m.tickExp,
        lotExp: m.lotExp,
        minQuantity: m.minQuantity,
        makerFeeBps: m.makerFeeBps,
        takerFeeBps: m.takerFeeBps,
        baseDecimals: m.baseRef.decimals,
        quoteDecimals: m.quoteRef.decimals,
    };
}

export async function fetchMarkets(signal?: AbortSignal): Promise<Market[]> {
    const { data } = await apiClient.get<ApiResponse<{ markets: ApiMarket[] }>>(MARKETS_URL, {
        signal,
    });
    return data.data.markets.map(toMarket);
}
