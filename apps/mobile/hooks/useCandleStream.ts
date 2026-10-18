import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ApiCandle, ApiResponse } from '@repo/types';
import { ServerMessageType } from '@repo/types/socket';
import { api } from '@/lib/api';
import { CANDLES_URL } from '@/lib/api-routes';
import { CANDLE_LIMIT, type IntervalOption } from '@/lib/chart/intervals';
import { liveSocket } from '@/lib/socket';
import { candleFeed } from '@/store/candles';

export function useCandleStream(marketId: string | undefined, interval: IntervalOption) {
    const key = `${marketId ?? ''}:${interval.key}`;

    const query = useQuery<ApiCandle[]>({
        queryKey: ['candles', marketId ?? '', interval.key],
        enabled: Boolean(marketId),
        queryFn: async ({ signal }) => {
            const { data } = await api.get<ApiResponse<{ candles: ApiCandle[] }>>(
                CANDLES_URL(marketId ?? ''),
                { params: { interval: interval.key, limit: CANDLE_LIMIT }, signal },
            );
            return data.data.candles;
        },
        staleTime: 0,
        gcTime: 60_000,
    });
    const refetch = query.refetch;

    useEffect(() => {
        if (!marketId) return;
        candleFeed.begin(key, interval.ms);
        const offMessage = liveSocket.subscribe((event) => {
            if (event.type === ServerMessageType.TRADE && event.market_id === marketId) {
                candleFeed.trade(event);
            }
        });
        const offOpen = liveSocket.onOpen(() => void refetch());
        return () => {
            offMessage();
            offOpen();
            candleFeed.end();
        };
    }, [key, marketId, interval.ms, refetch]);

    useEffect(() => {
        if (query.data) candleFeed.seed(key, query.data);
    }, [key, query.data]);

    return { isPending: query.isPending, isError: query.isError, refetch };
}
