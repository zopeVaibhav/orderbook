'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMarkets } from '@/lib/api/markets';
import type { Market } from '@/types/market';

export const marketsQueryKey = ['markets'] as const;

/**
 * The list only changes when a market is listed or halted, so it is cached long.
 */
export function useMarkets() {
    return useQuery<Market[]>({
        queryKey: marketsQueryKey,
        queryFn: ({ signal }) => fetchMarkets(signal),
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
