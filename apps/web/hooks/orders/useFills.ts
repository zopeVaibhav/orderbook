'use client';

import { useQuery } from '@tanstack/react-query';
import type { ApiResponse } from '@repo/types';
import { FILLS_URL } from '@/lib/api-routes';
import { apiClient } from '@/lib/axios';
import { useUserSessionStore } from '@/store/user/useUserSessionStore';
import type { UserFill } from '@/types/fill';

export const FILLS_QUERY_ROOT = 'fills';

export const fillsQueryKey = (marketId?: string) => [FILLS_QUERY_ROOT, marketId ?? 'all'] as const;

export function useFills(marketId?: string) {
    const signedIn = Boolean(useUserSessionStore((s) => s.accessToken));

    return useQuery<UserFill[]>({
        queryKey: fillsQueryKey(marketId),
        enabled: signedIn,
        queryFn: async ({ signal }) => {
            const { data } = await apiClient.get<ApiResponse<{ fills: UserFill[] }>>(FILLS_URL, {
                params: marketId ? { marketId } : undefined,
                signal,
            });
            return data.data.fills;
        },
        staleTime: 15_000,
    });
}
