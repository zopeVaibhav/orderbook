'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { handleBookSnapshot, handleEngineEvent } from '@/lib/market/engineEventHandlers';
import { seedCandleHistory } from '@/lib/market/mockFeed';
import { useCandlesStore } from '@/store/market/useCandlesStore';
import { clearBookDeltaQueue, useOrderBookStore } from '@/store/market/useOrderBookStore';
import { useTradesStore } from '@/store/market/useTradesStore';
import { useMarket } from '@/hooks/market/useMarkets';
import { useBook } from '@/hooks/market/useBook';
import { socketClient } from '@/socket/singleton.socket';

export function useMarketFeed(): void {
    const params = useParams<{ market?: string }>();
    const { data: market } = useMarket(params?.market);
    const { data: snapshot } = useBook(market?.id);

    useEffect(() => {
        if (!snapshot) return;
        handleBookSnapshot(snapshot);
    }, [snapshot]);

    useEffect(() => {
        if (!market?.id) return;
        socketClient.connect(market.id, handleEngineEvent);
        return () => {
            socketClient.disconnect();
            clearBookDeltaQueue();
            useOrderBookStore.getState().reset();
        };
    }, [market?.id]);

    useEffect(() => {
        const { timeframe, seed } = useCandlesStore.getState();
        seed(seedCandleHistory(Date.now(), timeframe.ms));

        return () => {
            useTradesStore.getState().reset();
        };
    }, []);
}
