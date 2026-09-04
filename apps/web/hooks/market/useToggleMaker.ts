'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '@repo/types';
import { MAKER_TOGGLE_URL } from '@/lib/api-routes';
import { apiClient } from '@/lib/axios';
import { marketsQueryKey } from '@/hooks/market/useMarkets';

type ToggleInput = { marketId: string; enabled: boolean };

type ToggleResponse = { market: { id: string; makerEnabled: boolean } };

export function useToggleMaker() {
    const client = useQueryClient();

    return useMutation({
        mutationFn: async ({ marketId, enabled }: ToggleInput) => {
            const { data } = await apiClient.patch<ApiResponse<ToggleResponse>>(
                MAKER_TOGGLE_URL(marketId),
                { enabled },
            );
            return data.data.market;
        },
        onSuccess: () => client.invalidateQueries({ queryKey: marketsQueryKey }),
    });
}
