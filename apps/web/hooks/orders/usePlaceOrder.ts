'use client';

import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import type { ApiResponse, OrderKind, Side, TimeInForce } from '@repo/types';
import { ORDERS_URL } from '@/lib/api-routes';
import { apiClient } from '@/lib/axios';

export type PlaceOrderInput = {
    marketId: string;
    clientOrderId: string;
    side: Side;
    kind: OrderKind;
    timeInForce?: TimeInForce;
    price?: string;
    quantity: string;
};

export function usePlaceOrder() {
    return useMutation({
        mutationFn: async (input: PlaceOrderInput) => {
            const { data } = await apiClient.post<ApiResponse<PlaceOrderInput>>(ORDERS_URL, input);
            return data.data;
        },
    });
}

export function placeOrderErrorMessage(error: unknown): string {
    if (isAxiosError(error)) {
        const data = error.response?.data as { error?: string; message?: string } | undefined;
        if (error.response?.status === 401) return 'Sign in to place orders';
        return data?.error ?? data?.message ?? error.message;
    }
    return error instanceof Error ? error.message : 'Order failed';
}
