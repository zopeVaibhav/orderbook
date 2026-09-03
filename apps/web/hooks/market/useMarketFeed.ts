'use client';

import { useEffect } from 'react';
import { handleBookSnapshot, handleEngineEvent } from '@/lib/market/engineEventHandlers';
import { mockFeed, seedCandleHistory } from '@/lib/market/mockFeed';
import { useCandlesStore } from '@/store/market/useCandlesStore';
import { clearBookDeltaQueue, useOrderBookStore } from '@/store/market/useOrderBookStore';
import { useTradesStore } from '@/store/market/useTradesStore';

export function useMarketFeed(): void {
    useEffect(() => {
        handleBookSnapshot(mockFeed.snapshot());

        const { timeframe, seed } = useCandlesStore.getState();
        seed(seedCandleHistory(Date.now(), timeframe.ms));

        mockFeed.start(handleEngineEvent);

        return () => {
            mockFeed.stop();
            clearBookDeltaQueue();
            useOrderBookStore.getState().reset();
            useTradesStore.getState().reset();
        };
    }, []);
}
