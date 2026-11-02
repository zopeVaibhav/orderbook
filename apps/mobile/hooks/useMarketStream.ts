import { useEffect } from 'react';
import { ServerMessageType } from '@repo/types/socket';
import { useBookSnapshot, useTrades } from '@/hooks/queries/useAccount';
import { liveSocket } from '@/lib/socket';
import { marketBook } from '@/store/orderbook';

export function useMarketStream(marketId: string | undefined) {
    const snapshot = useBookSnapshot(marketId);
    const history = useTrades(marketId);
    const refetchSnapshot = snapshot.refetch;
    const refetchHistory = history.refetch;

    useEffect(() => {
        if (!marketId) return;
        marketBook.begin(marketId);

        const offMessage = liveSocket.subscribe((event) => {
            if (!('market_id' in event) || event.market_id !== marketId) return;
            if (event.type === ServerMessageType.BOOK_DELTA) marketBook.delta(event);
            else if (event.type === ServerMessageType.TRADE) marketBook.trade(event);
        });
        const offOpen = liveSocket.onOpen(() => {
            void refetchSnapshot();
            void refetchHistory();
        });
        liveSocket.setMarket(marketId);

        return () => {
            offMessage();
            offOpen();
            liveSocket.setMarket(null);
            marketBook.end();
        };
    }, [marketId, refetchSnapshot, refetchHistory]);

    useEffect(() => {
        if (snapshot.data) marketBook.snapshot(snapshot.data);
    }, [snapshot.data]);

    useEffect(() => {
        if (history.data) marketBook.seedTrades(history.data);
    }, [history.data]);

    const refresh = async () => {
        await Promise.all([refetchSnapshot(), refetchHistory()]);
    };

    return { isError: snapshot.isError, refresh, isRefreshing: snapshot.isRefetching };
}
