import { useCandlesStore } from '@/store/market/useCandlesStore';
import { queueBookDelta, useOrderBookStore } from '@/store/market/useOrderBookStore';
import { useTradesStore } from '@/store/market/useTradesStore';
import type { BookSnapshotPayload, EngineEvent } from '@repo/types';

/**
 * The single entry point for everything the engine emits.
 *
 * Stores are written through `getState()` rather than hooks on purpose: the
 * WebSocket client lives outside React, so this must be callable from anywhere.
 * That is the reason this state is in Zustand and not a context.
 *
 * The mock feed and the real socket both call this, so swapping transports
 * changes nothing downstream.
 */
export function handleEngineEvent(event: EngineEvent): void {
    switch (event.type) {
        case 'book_delta':
            queueBookDelta(event);
            break;

        case 'trade': {
            useTradesStore.getState().addTrade(event);
            useCandlesStore
                .getState()
                .applyTrade(parseFloat(event.price), parseFloat(event.quantity), event.ts);
            break;
        }

        case 'ack':
            // Order acks belong to a user-scoped store that needs auth and an
            // order-submission path first. Ignored until those exist.
            break;
    }
}

export function handleBookSnapshot(snapshot: BookSnapshotPayload): void {
    useOrderBookStore.getState().applySnapshot(snapshot);
}
