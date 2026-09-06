import { create } from 'zustand';
import type { BookDelta } from '@repo/types/kafka';
import type { BookSnapshotPayload } from '@repo/types/socket';

export type FeedStatus = 'connecting' | 'live' | 'stale';

interface OrderBookState {
    marketId: string | null;
    asks: Map<string, string>;
    bids: Map<string, string>;
    lastSeq: number;
    status: FeedStatus;
    applySnapshot: (snapshot: BookSnapshotPayload) => void;
    applyDelta: (delta: BookDelta) => void;
    applyDeltas: (deltas: BookDelta[]) => void;
    reset: () => void;
}

export const useOrderBookStore = create<OrderBookState>((set, get) => ({
    marketId: null,
    asks: new Map(),
    bids: new Map(),
    lastSeq: 0,
    status: 'connecting',

    applySnapshot: (snapshot) =>
        set({
            marketId: snapshot.market_id,
            asks: new Map(snapshot.asks),
            bids: new Map(snapshot.bids),
            lastSeq: snapshot.seq,
            status: 'live',
        }),

    applyDelta: (delta) => get().applyDeltas([delta]),

    applyDeltas: (deltas) => {
        const state = get();
        let lastSeq = state.lastSeq;

        const asks = new Map(state.asks);
        const bids = new Map(state.bids);
        let marketId = state.marketId;
        let applied = false;

        for (const delta of deltas) {
            if (delta.seq <= lastSeq) continue;

            for (const change of delta.changes) {
                const side = change.side === 'ASK' ? asks : bids;
                if (parseFloat(change.new_quantity) === 0) side.delete(change.price);
                else side.set(change.price, change.new_quantity);
            }

            lastSeq = delta.seq;
            marketId = delta.market_id;
            applied = true;
        }

        if (!applied) return;
        set({ asks, bids, lastSeq, marketId, status: 'live' });
    },

    reset: () =>
        set({
            marketId: null,
            asks: new Map(),
            bids: new Map(),
            lastSeq: 0,
            status: 'connecting',
        }),
}));

const HIDDEN_FLUSH_MS = 250;
const MAX_PENDING = 500;

let pending: BookDelta[] = [];
let frame = 0;
let timer: ReturnType<typeof setTimeout> | null = null;

function isHidden(): boolean {
    return typeof document !== 'undefined' && document.hidden;
}

function clearScheduled() {
    if (frame !== 0) cancelAnimationFrame(frame);
    if (timer !== null) clearTimeout(timer);
    frame = 0;
    timer = null;
}

function flush() {
    clearScheduled();
    if (pending.length === 0) return;
    if (useOrderBookStore.getState().marketId === null) return;

    const batch = pending;
    pending = [];
    useOrderBookStore.getState().applyDeltas(batch);
}

function schedule() {
    if (frame !== 0 || timer !== null) return;
    if (isHidden()) timer = setTimeout(flush, HIDDEN_FLUSH_MS);
    else frame = requestAnimationFrame(flush);
}

export function queueBookDelta(delta: BookDelta): void {
    pending.push(delta);

    if (pending.length < MAX_PENDING) {
        schedule();
        return;
    }

    if (useOrderBookStore.getState().marketId !== null) {
        flush();
        return;
    }

    pending.splice(0, pending.length - MAX_PENDING);
    schedule();
}

export function flushBookDeltaQueue(): void {
    flush();
}

export function clearBookDeltaQueue(): void {
    clearScheduled();
    pending = [];
}

if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (pending.length === 0) return;
        clearScheduled();
        schedule();
    });
}
