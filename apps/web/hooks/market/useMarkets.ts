'use client';

import { useQuery } from '@tanstack/react-query';
import type { ApiResponse } from '@repo/types';
import { MARKETS_URL } from '@/lib/api-routes';
import { apiClient } from '@/lib/axios';
import { toMarket } from '@/lib/market/marketMappers';
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
