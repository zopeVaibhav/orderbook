'use client';

import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { placeOrder, type PlaceOrderInput } from '@/lib/api/orders';

/**
 * Nothing to invalidate: the response only confirms the order reached kafka.
 */
export function usePlaceOrder() {
    return useMutation({
        mutationFn: (input: PlaceOrderInput) => placeOrder(input),
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
