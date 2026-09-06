'use client';

import { useQuery } from '@tanstack/react-query';
import type { ApiResponse } from '@repo/types';
import { MARKET_STATS_URL } from '@/lib/api-routes';
import { apiClient } from '@/lib/axios';
import type { MarketStats } from '@/types/market';

const REFRESH_MS = 30_000;

export const marketStatsQueryKey = ['market-stats'] as const;

export function useMarketStats() {
    return useQuery<MarketStats[]>({
        queryKey: marketStatsQueryKey,
        queryFn: async ({ signal }) => {
            const { data } = await apiClient.get<ApiResponse<{ stats: MarketStats[] }>>(
                MARKET_STATS_URL,
                { signal },
            );
            return data.data.stats;
        },
        staleTime: REFRESH_MS,
        refetchInterval: REFRESH_MS,
    });
}
