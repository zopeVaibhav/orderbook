import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse, Balance, PublicTrade, UserFill, UserOrder } from '@repo/types';
import type { BookSnapshotPayload } from '@repo/types/socket';
import { api } from '@/lib/api';
import { BALANCE_URL, BOOK_URL, FILLS_URL, ORDERS_URL, TRADES_URL } from '@/lib/api-routes';
import { useSession } from '@/store/session';
import { useMarkets } from './useMarkets';

const QUOTE_ASSET = 'USDC';

export const balancesQueryKey = ['balances'] as const;
export const fillsQueryKey = ['fills'] as const;
export const openOrdersQueryKey = ['orders', 'open'] as const;
export const tradesQueryKey = (marketId: string) => ['trades', marketId] as const;

function useSignedIn(): boolean {
    return useSession((s) => s.status === 'signedIn');
}

export function useBalances() {
    const enabled = useSignedIn();
    return useQuery<Balance[]>({
        queryKey: balancesQueryKey,
        enabled,
        queryFn: async ({ signal }) => {
            const { data } = await api.get<ApiResponse<{ balance: Balance[] }>>(BALANCE_URL, {
                signal,
            });
            return data.data.balance;
        },
        staleTime: 15_000,
    });
}

export function useFills() {
    const enabled = useSignedIn();
    return useQuery<UserFill[]>({
        queryKey: fillsQueryKey,
        enabled,
        queryFn: async ({ signal }) => {
            const { data } = await api.get<ApiResponse<{ fills: UserFill[] }>>(FILLS_URL, {
                signal,
            });
            return data.data.fills;
        },
        staleTime: 15_000,
    });
}

export function useOpenOrders() {
    const enabled = useSignedIn();
    return useQuery<UserOrder[]>({
        queryKey: openOrdersQueryKey,
        enabled,
        queryFn: async ({ signal }) => {
            const { data } = await api.get<ApiResponse<{ orders: UserOrder[] }>>(ORDERS_URL, {
                params: { status: 'open' },
                signal,
            });
            return data.data.orders;
        },
        staleTime: 15_000,
    });
}

export function useCancelOrder() {
    const client = useQueryClient();
    return useMutation({
        mutationFn: async (clientOrderId: string) => {
            await api.delete(`${ORDERS_URL}/${clientOrderId}`);
        },
        onSettled: () => {
            void client.invalidateQueries({ queryKey: openOrdersQueryKey });
            void client.invalidateQueries({ queryKey: balancesQueryKey });
        },
    });
}

export function useTrades(marketId: string | undefined) {
    return useQuery<PublicTrade[]>({
        queryKey: tradesQueryKey(marketId ?? ''),
        enabled: Boolean(marketId),
        queryFn: async ({ signal }) => {
            const { data } = await api.get<ApiResponse<{ trades: PublicTrade[] }>>(
                TRADES_URL(marketId ?? ''),
                { signal },
            );
            return data.data.trades;
        },
        staleTime: 0,
        gcTime: 0,
    });
}

export function useBookSnapshot(marketId: string | undefined) {
    return useQuery<BookSnapshotPayload>({
        queryKey: ['book', marketId ?? ''],
        enabled: Boolean(marketId),
        queryFn: async ({ signal }) => {
            const { data } = await api.get<ApiResponse<{ book: BookSnapshotPayload }>>(
                BOOK_URL(marketId ?? ''),
                { signal },
            );
            return data.data.book;
        },
        staleTime: 0,
        gcTime: 0,
    });
}

export interface Holding {
    asset: string;
    name: string;
    marketId: string | null;
    quantity: number;
    locked: number;
    price: number | null;
    value: number | null;
    change24h: number | null;
}

export interface Portfolio {
    total: number;
    cash: number;
    inOrders: number;
    change24h: number | null;
    holdings: Holding[];
}

export function usePortfolio() {
    const balances = useBalances();
    const markets = useMarkets();

    const data = useMemo<Portfolio | undefined>(() => {
        if (!balances.data) return undefined;
        const byBase = new Map(
            (markets.data ?? []).filter((m) => m.quote === QUOTE_ASSET).map((m) => [m.base, m]),
        );

        let total = 0;
        let cash = 0;
        let inOrders = 0;
        let openValue = 0;
        let pricedValue = 0;
        const holdings: Holding[] = [];

        for (const b of balances.data) {
            const available = parseFloat(b.available);
            const locked = parseFloat(b.locked);
            const quantity = available + locked;
            if (b.asset === QUOTE_ASSET) {
                cash = available;
                inOrders += locked;
                total += quantity;
                continue;
            }
            if (quantity <= 0) continue;
            const market = byBase.get(b.asset);
            const price = market?.price ?? null;
            const value = price === null ? null : quantity * price;
            if (value !== null) {
                total += value;
                inOrders += locked * (price ?? 0);
                if (market?.openPrice) {
                    openValue += quantity * market.openPrice;
                    pricedValue += value;
                }
            }
            holdings.push({
                asset: b.asset,
                name: market?.name ?? b.asset,
                marketId: market?.id ?? null,
                quantity,
                locked,
                price,
                value,
                change24h: market?.change24h ?? null,
            });
        }

        holdings.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
        const change24h = openValue > 0 ? ((pricedValue - openValue) / openValue) * 100 : null;
        return { total, cash, inOrders, change24h, holdings };
    }, [balances.data, markets.data]);

    return {
        data,
        isPending: balances.isPending,
        isError: balances.isError,
        refetch: balances.refetch,
    };
}
