import { create } from 'zustand';
import type { BookDelta, BookSnapshotPayload } from '@repo/types/kafka';

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

/**
 * Price keys stay strings on purpose. The engine sends scaled decimals as
 * strings; parsing them to floats risks 64328.3 and 64328.30000000001 becoming
 * separate keys, and loses precision on money. Parse only when sorting or
 * displaying.
 *
 * Maps are replaced rather than mutated so Zustand/React see a new reference.
 * Deltas are batched to a frame first (see queueDelta), so the copy happens once
 * per frame instead of once per event.
 */
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

    /** Copies the maps once for the whole batch rather than once per delta. */
    applyDeltas: (deltas) => {
        const state = get();
        let lastSeq = state.lastSeq;

        const asks = new Map(state.asks);
        const bids = new Map(state.bids);
        let marketId = state.marketId;
        let applied = false;

        for (const delta of deltas) {
            // `seq` is the Kafka offset of the order that produced the event, and
            // every event from one order carries the same value — so consecutive
            // book deltas legitimately skip numbers and `seq + 1` is NOT a valid
            // gap test. All we can safely reject here is replayed or reordered
            // events. Detecting genuine loss needs a per-stream counter the engine
            // does not emit yet; until it does, resync is snapshot-driven.
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

// --- frame batching -------------------------------------------------------
// The engine can emit deltas far faster than the screen refreshes. Applying
// each one straight to React state would commit many times per frame, so
// buffer them and flush once on the next animation frame.

// A hidden tab gets no animation frames at all, so rAF alone would freeze the
// book and let the buffer grow without bound until the user came back. Fall
// back to a timer whenever the document is hidden, and hard-cap the buffer.

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
    // Never let a stalled scheduler turn into unbounded memory growth.
    if (pending.length >= MAX_PENDING) {
        flush();
        return;
    }
    schedule();
}

export function clearBookDeltaQueue(): void {
    clearScheduled();
    pending = [];
}

// Switching visibility invalidates whichever scheduler is armed: a pending rAF
// will never fire once hidden, and a timer is the slower choice once visible.
if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (pending.length === 0) return;
        clearScheduled();
        schedule();
    });
}
