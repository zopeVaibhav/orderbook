'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ApiResponse } from '@repo/types';
import { MARKETS_URL } from '@/lib/api-routes';
import { apiClient } from '@/lib/axios';
import { toMarket } from '@/lib/market/marketMappers';
import { useMarketStats } from '@/hooks/market/useMarketStats';
import type { ApiMarket, Market } from '@/types/market';

export const marketsQueryKey = ['markets'] as const;

export function useMarkets() {
    return useQuery<Market[]>({
        queryKey: marketsQueryKey,
        queryFn: async ({ signal }) => {
            const { data } = await apiClient.get<ApiResponse<{ markets: ApiMarket[] }>>(
                MARKETS_URL,
                { signal },
            );
            return data.data.markets.map(toMarket);
        },
        staleTime: 5 * 60_000,
        refetchInterval: 5 * 60_000,
    });
}

export function useMarket(slug: string | undefined) {
    const query = useMarkets();
    return {
        ...query,
        data: slug ? query.data?.find((m) => m.slug === slug || m.symbol === slug) : undefined,
    };
}

export function useMarketsWithStats() {
    const markets = useMarkets();
    const { data: stats } = useMarketStats();

    const data = useMemo(() => {
        if (!markets.data || !stats) return markets.data;

        const byId = new Map(stats.map((stat) => [stat.marketId, stat]));

        return markets.data.map((market) => {
            const stat = byId.get(market.id);
            if (!stat) return market;

            return {
                ...market,
                price: parseFloat(stat.lastPrice),
                change24h: stat.change24h,
                volume24h: parseFloat(stat.volume24h),
            };
        });
    }, [markets.data, stats]);

    return { ...markets, data };
}

export function useMarketWithStats(slug: string | undefined) {
    const query = useMarketsWithStats();
    return {
        ...query,
        data: slug ? query.data?.find((m) => m.slug === slug || m.symbol === slug) : undefined,
    };
}
