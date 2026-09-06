'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import type { ApiResponse } from '@repo/types';
import { CANCEL_ORDER_URL, ORDERS_URL } from '@/lib/api-routes';
import { apiClient } from '@/lib/axios';
import { balancesQueryKey } from '@/hooks/balance/useGetBalances';
import { FILLS_QUERY_ROOT } from '@/hooks/orders/useFills';
import { useUserSessionStore } from '@/store/user/useUserSessionStore';
import type { OrderStatusFilter, UserOrder } from '@/types/order';

export const ORDERS_QUERY_ROOT = 'orders';

export const ordersQueryKey = (status: OrderStatusFilter, marketId?: string) =>
    [ORDERS_QUERY_ROOT, status, marketId ?? 'all'] as const;

export function useOrders(status: OrderStatusFilter, marketId?: string) {
    const signedIn = Boolean(useUserSessionStore((s) => s.accessToken));

    return useQuery<UserOrder[]>({
        queryKey: ordersQueryKey(status, marketId),
        enabled: signedIn,
        queryFn: async ({ signal }) => {
            const { data } = await apiClient.get<ApiResponse<{ orders: UserOrder[] }>>(ORDERS_URL, {
                params: { status, ...(marketId ? { marketId } : {}) },
                signal,
            });
            return data.data.orders;
        },
        staleTime: 15_000,
    });
}

export function useCancelOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (clientOrderId: string) => {
            const { data } = await apiClient.delete<ApiResponse<{ clientOrderId: string }>>(
                CANCEL_ORDER_URL(clientOrderId),
            );
            return data.data;
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [ORDERS_QUERY_ROOT] });
            queryClient.invalidateQueries({ queryKey: [FILLS_QUERY_ROOT] });
            queryClient.invalidateQueries({ queryKey: balancesQueryKey });
        },
    });
}

export function cancelOrderErrorMessage(error: unknown): string {
    if (isAxiosError(error)) {
        const data = error.response?.data as { error?: string; message?: string } | undefined;
        if (error.response?.status === 401) return 'Sign in to cancel orders';
        return data?.error ?? data?.message ?? error.message;
    }
    return error instanceof Error ? error.message : 'Cancel failed';
}
