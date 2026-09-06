'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ServerMessageType, type ServerSocketMessage } from '@repo/types/socket';
import { handleBookSnapshot, handleEngineEvent } from '@/lib/market/engineEventHandlers';
import { useCandlesStore } from '@/store/market/useCandlesStore';
import { clearBookDeltaQueue, useOrderBookStore } from '@/store/market/useOrderBookStore';
import { useTradesStore } from '@/store/market/useTradesStore';
import { useMarket } from '@/hooks/market/useMarkets';
import { useBook } from '@/hooks/market/useBook';
import { useTrades } from '@/hooks/market/useTrades';
import { balancesQueryKey } from '@/hooks/balance/useGetBalances';
import { FILLS_QUERY_ROOT } from '@/hooks/orders/useFills';
import { ORDERS_QUERY_ROOT } from '@/hooks/orders/useOrders';
import { useUserSessionStore } from '@/store/user/useUserSessionStore';
import { socketClient } from '@/socket/singleton.socket';

const BALANCE_REFRESH_MS = 250;

export function useMarketFeed(): void {
    const params = useParams<{ market?: string }>();
    const { data: market } = useMarket(params?.market);
    const { data: snapshot } = useBook(market?.id);
    const { data: history } = useTrades(market?.id);

    const queryClient = useQueryClient();
    const accessToken = useUserSessionStore((s) => s.accessToken);

    useEffect(() => {
        if (!snapshot) return;
        handleBookSnapshot(snapshot);
    }, [snapshot]);

    useEffect(() => {
        if (!history) return;
        useTradesStore.getState().seed(history);
        useCandlesStore.getState().seedHistory(
            history.map((trade) => ({
                price: parseFloat(trade.price),
                quantity: parseFloat(trade.quantity),
                ts: trade.ts,
            })),
        );
    }, [history]);

    useEffect(() => {
        if (!market?.id) return;

        let refresh: ReturnType<typeof setTimeout> | null = null;

        const listener = (event: ServerSocketMessage) => {
            if (event.type !== ServerMessageType.BALANCE_STALE) {
                handleEngineEvent(event);
                return;
            }

            if (refresh) return;
            refresh = setTimeout(() => {
                refresh = null;
                queryClient.invalidateQueries({ queryKey: balancesQueryKey });
                queryClient.invalidateQueries({ queryKey: [FILLS_QUERY_ROOT] });
                queryClient.invalidateQueries({ queryKey: [ORDERS_QUERY_ROOT] });
            }, BALANCE_REFRESH_MS);
        };

        socketClient.connect(market.id, listener, accessToken);

        return () => {
            if (refresh) clearTimeout(refresh);
            socketClient.disconnect();
            clearBookDeltaQueue();
            useOrderBookStore.getState().reset();
        };
    }, [market?.id, accessToken, queryClient]);

    useEffect(() => {
        return () => {
            useTradesStore.getState().reset();
            useCandlesStore.getState().reset();
        };
    }, []);
}
