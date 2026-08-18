'use client';

import { useEffect } from 'react';
import { handleBookSnapshot, handleEngineEvent } from '@/lib/market/engineEventHandlers';
import { mockFeed, seedCandleHistory } from '@/lib/market/mockFeed';
import { useCandlesStore } from '@/store/market/useCandlesStore';
import { clearBookDeltaQueue, useOrderBookStore } from '@/store/market/useOrderBookStore';
import { useTradesStore } from '@/store/market/useTradesStore';

/**
 * Owns the feed's lifecycle. Mount once, near the top of the trade screen.
 *
 * Deltas are meaningless without a base, so the snapshot is applied before the
 * stream starts — the same order the real client will follow (REST snapshot,
 * then socket).
 */
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
