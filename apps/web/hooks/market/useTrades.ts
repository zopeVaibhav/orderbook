'use client';

import { useQuery } from '@tanstack/react-query';
import type { ApiResponse } from '@repo/types';
import type { PublicTrade } from '@repo/types/socket';
import { TRADES_URL } from '@/lib/api-routes';
import { apiClient } from '@/lib/axios';

export const tradesQueryKey = (marketId: string | undefined) => ['trades', marketId] as const;

export function useTrades(marketId: string | undefined) {
    return useQuery<PublicTrade[]>({
        queryKey: tradesQueryKey(marketId),
        enabled: Boolean(marketId),
        queryFn: async ({ signal }) => {
            const { data } = await apiClient.get<ApiResponse<{ trades: PublicTrade[] }>>(
                TRADES_URL(marketId!),
                { signal },
            );
            return data.data.trades;
        },
        staleTime: 0,
        gcTime: 0,
    });
}
