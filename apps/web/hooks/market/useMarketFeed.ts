'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { handleBookSnapshot, handleEngineEvent } from '@/lib/market/engineEventHandlers';
import { mockFeed, seedCandleHistory } from '@/lib/market/mockFeed';
import { useCandlesStore } from '@/store/market/useCandlesStore';
import { clearBookDeltaQueue, useOrderBookStore } from '@/store/market/useOrderBookStore';
import { useTradesStore } from '@/store/market/useTradesStore';
import { useMarket } from '@/hooks/market/useMarkets';
import { useBook } from '@/hooks/market/useBook';

export function useMarketFeed(): void {
    const params = useParams<{ market?: string }>();
    const { data: market } = useMarket(params?.market);
    const { data: snapshot } = useBook(market?.id);

    useEffect(() => {
        if (!snapshot) return;
        handleBookSnapshot(snapshot);
    }, [snapshot]);

    useEffect(() => {
        const { timeframe, seed } = useCandlesStore.getState();
        seed(seedCandleHistory(Date.now(), timeframe.ms));

        mockFeed.start((event) => {
            if (event.type === 'book_delta') return;
            handleEngineEvent(event);
        });

        return () => {
            mockFeed.stop();
            clearBookDeltaQueue();
            useOrderBookStore.getState().reset();
            useTradesStore.getState().reset();
        };
    }, []);
}
