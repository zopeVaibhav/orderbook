import { useCandlesStore } from '@/store/market/useCandlesStore';
import { queueBookDelta, useOrderBookStore } from '@/store/market/useOrderBookStore';
import { useTradesStore } from '@/store/market/useTradesStore';
import type { BookSnapshotPayload, EngineEvent } from '@repo/types/kafka';

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
            break;
    }
}

export function handleBookSnapshot(snapshot: BookSnapshotPayload): void {
    useOrderBookStore.getState().applySnapshot(snapshot);
}
