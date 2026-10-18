import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ApiMarket, ApiResponse, MarketStats } from '@repo/types';
import { api } from '@/lib/api';
import { MARKET_STATS_URL, MARKETS_URL } from '@/lib/api-routes';

export interface Market {
    id: string;
    base: string;
    quote: string;
    name: string;
    price: number | null;
    openPrice: number | null;
    change24h: number | null;
    volume24h: number | null;
}

const STATS_REFRESH_MS = 30_000;

export const marketsQueryKey = ['markets'] as const;
export const marketStatsQueryKey = ['market-stats'] as const;

export function useMarketList() {
    return useQuery<ApiMarket[]>({
        queryKey: marketsQueryKey,
        queryFn: async ({ signal }) => {
            const { data } = await api.get<ApiResponse<{ markets: ApiMarket[] }>>(MARKETS_URL, {
                signal,
            });
            return data.data.markets;
        },
        staleTime: 5 * 60_000,
    });
}

export function useMarketStats() {
    return useQuery<MarketStats[]>({
        queryKey: marketStatsQueryKey,
        queryFn: async ({ signal }) => {
            const { data } = await api.get<ApiResponse<{ stats: MarketStats[] }>>(
                MARKET_STATS_URL,
                { signal },
            );
            return data.data.stats;
        },
        staleTime: STATS_REFRESH_MS,
        refetchInterval: STATS_REFRESH_MS,
    });
}

export function useMarkets() {
    const markets = useMarketList();
    const stats = useMarketStats();

    const data = useMemo<Market[] | undefined>(() => {
        if (!markets.data) return undefined;
        const byId = new Map((stats.data ?? []).map((s) => [s.marketId, s]));
        return markets.data.map((m) => {
            const stat = byId.get(m.id);
            return {
                id: m.id,
                base: m.base,
                quote: m.quote,
                name: m.baseRef.name,
                price: stat ? parseFloat(stat.lastPrice) : null,
                openPrice: stat ? parseFloat(stat.openPrice) : null,
                change24h: stat ? stat.change24h : null,
                volume24h: stat ? parseFloat(stat.volume24h) : null,
            };
        });
    }, [markets.data, stats.data]);

    const refetch = async () => {
        await Promise.all([markets.refetch(), stats.refetch()]);
    };

    return {
        data,
        isPending: markets.isPending,
        isError: markets.isError,
        isRefetching: markets.isRefetching || stats.isRefetching,
        refetch,
    };
}

export function useMarket(marketId: string | undefined) {
    const query = useMarkets();
    return { ...query, data: query.data?.find((m) => m.id === marketId) };
}
