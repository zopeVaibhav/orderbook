'use client';

import { useQuery } from '@tanstack/react-query';
import type { ApiResponse } from '@repo/types';
import type { BookSnapshotPayload } from '@repo/types/socket';
import { BOOK_URL } from '@/lib/api-routes';
import { apiClient } from '@/lib/axios';

export const bookQueryKey = (marketId: string | undefined) => ['book', marketId] as const;

export function useBook(marketId: string | undefined) {
    return useQuery<BookSnapshotPayload>({
        queryKey: bookQueryKey(marketId),
        enabled: Boolean(marketId),
        queryFn: async ({ signal }) => {
            const { data } = await apiClient.get<ApiResponse<{ book: BookSnapshotPayload }>>(
                BOOK_URL(marketId!),
                { signal },
            );
            return data.data.book;
        },
        staleTime: 0,
        gcTime: 0,
    });
}
