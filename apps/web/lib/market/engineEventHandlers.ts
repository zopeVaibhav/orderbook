import { useCandlesStore } from '@/store/market/useCandlesStore';
import { queueBookDelta, useOrderBookStore } from '@/store/market/useOrderBookStore';
import { useTradesStore } from '@/store/market/useTradesStore';
import {
    ServerMessageType,
    type BookSnapshotPayload,
    type ServerSocketMessage,
} from '@repo/types/socket';

export function handleEngineEvent(event: ServerSocketMessage): void {
    switch (event.type) {
        case ServerMessageType.BOOK_DELTA:
            queueBookDelta(event);
            break;

        case ServerMessageType.TRADE: {
            useTradesStore.getState().addTrade(event);
            useCandlesStore
                .getState()
                .applyTrade(parseFloat(event.price), parseFloat(event.quantity), event.ts);
            break;
        }

        case ServerMessageType.ACK:
            break;
    }
}

export function handleBookSnapshot(snapshot: BookSnapshotPayload): void {
    useOrderBookStore.getState().applySnapshot(snapshot);
}
