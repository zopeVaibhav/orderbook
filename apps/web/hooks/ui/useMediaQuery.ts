'use client';

import { useCallback, useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
    const subscribe = useCallback(
        (notify: () => void) => {
            const list = window.matchMedia(query);
            list.addEventListener('change', notify);
            return () => list.removeEventListener('change', notify);
        },
        [query],
    );

    return useSyncExternalStore(
        subscribe,
        () => window.matchMedia(query).matches,
        () => false,
    );
}
