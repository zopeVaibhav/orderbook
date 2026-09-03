'use client';

import { useQuery } from '@tanstack/react-query';
import type { ApiResponse } from '@repo/types';
import { BALANCE_URL } from '@/lib/api-routes';
import { apiClient } from '@/lib/axios';
import { useUserSessionStore } from '@/store/user/useUserSessionStore';
import type { Balance } from '@/types/balance';

export const balancesQueryKey = ['balances'] as const;

export function useBalances() {
    const accessToken = Boolean(useUserSessionStore((s) => s.accessToken));

    return useQuery<Balance[]>({
        queryKey: balancesQueryKey,
        enabled: accessToken,
        queryFn: async ({ signal }) => {
            const { data } = await apiClient.get<ApiResponse<{ balance: Balance[] }>>(BALANCE_URL, {
                signal,
            });
            return data.data.balance;
        },
        staleTime: 15_000,
    });
}

export function useBalance(asset: string | undefined) {
    const query = useBalances();
    return {
        ...query,
        data: asset ? query.data?.find((entry) => entry.asset === asset) : undefined,
    };
}

export function availableOf(balance: Balance | undefined): number {
    return balance ? parseFloat(balance.available) : 0;
}

export function lockedOf(balance: Balance | undefined): number {
    return balance ? parseFloat(balance.locked) : 0;
}

export function totalOf(balance: Balance | undefined): number {
    return availableOf(balance) + lockedOf(balance);
}
