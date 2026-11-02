import { useEffect } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { ServerMessageType } from '@repo/types/socket';
import { balancesQueryKey, fillsQueryKey, ordersQueryKey } from '@/hooks/queries/useAccount';
import { marketStatsQueryKey } from '@/hooks/queries/useMarkets';
import { queryClient } from '@/lib/query-client';
import { liveSocket } from '@/lib/socket';
import { queueTicker } from '@/lib/tickers';
import { useSession } from '@/store/session';

const BALANCE_REFRESH_MS = 250;

export function useLiveFeed(): void {
    const token = useSession((s) => s.accessToken);

    useEffect(() => {
        liveSocket.setToken(token);
    }, [token]);

    useEffect(() => {
        let refresh: ReturnType<typeof setTimeout> | null = null;

        const offMessage = liveSocket.subscribe((event) => {
            if (event.type === ServerMessageType.TRADE) {
                queueTicker(event);
                return;
            }
            if (event.type !== ServerMessageType.BALANCE_STALE || refresh) return;
            refresh = setTimeout(() => {
                refresh = null;
                void queryClient.invalidateQueries({ queryKey: balancesQueryKey });
                void queryClient.invalidateQueries({ queryKey: fillsQueryKey });
                void queryClient.invalidateQueries({ queryKey: ordersQueryKey });
            }, BALANCE_REFRESH_MS);
        });

        const offOpen = liveSocket.onOpen(() => {
            void queryClient.invalidateQueries({ queryKey: marketStatsQueryKey });
            void queryClient.invalidateQueries({ queryKey: balancesQueryKey });
        });

        const appState = AppState.addEventListener('change', (state) =>
            liveSocket.setForeground(state === 'active'),
        );
        const offNet = NetInfo.addEventListener((state) =>
            liveSocket.setOnline(state.isConnected !== false),
        );

        liveSocket.setForeground(AppState.currentState === 'active');
        liveSocket.setTickers(true);

        return () => {
            if (refresh) clearTimeout(refresh);
            offMessage();
            offOpen();
            appState.remove();
            offNet();
            liveSocket.setTickers(false);
            liveSocket.setToken(null);
        };
    }, []);
}
