import { create } from 'zustand';
import type { BookDelta } from '@repo/types/kafka';
import type { BookSnapshotPayload, PublicTrade } from '@repo/types/socket';

const RECENT_DELTAS = 300;
const MAX_TRADES = 80;

interface MarketBookState {
    marketId: string | null;
    asks: Map<string, string>;
    bids: Map<string, string>;
    lastSeq: number;
    ready: boolean;
    trades: PublicTrade[];
}

const EMPTY: MarketBookState = {
    marketId: null,
    asks: new Map(),
    bids: new Map(),
    lastSeq: 0,
    ready: false,
    trades: [],
};

export const useMarketBook = create<MarketBookState>(() => EMPTY);

let recent: BookDelta[] = [];
let pendingDeltas: BookDelta[] = [];
let pendingTrades: PublicTrade[] = [];
let frame = 0;

function apply(
    asks: Map<string, string>,
    bids: Map<string, string>,
    deltas: BookDelta[],
    fromSeq: number,
): number {
    let lastSeq = fromSeq;
    for (const delta of deltas) {
        if (delta.seq <= lastSeq) continue;
        for (const change of delta.changes) {
            const side = change.side === 'ASK' ? asks : bids;
            if (parseFloat(change.new_quantity) === 0) side.delete(change.price);
            else side.set(change.price, change.new_quantity);
        }
        lastSeq = delta.seq;
    }
    return lastSeq;
}

function mergeTrades(current: PublicTrade[], incoming: PublicTrade[]): PublicTrade[] {
    const byId = new Map(current.map((t) => [t.trade_id, t]));
    for (const trade of incoming) byId.set(trade.trade_id, trade);
    return [...byId.values()].sort((a, b) => b.trade_id - a.trade_id).slice(0, MAX_TRADES);
}

function flush(): void {
    frame = 0;
    const state = useMarketBook.getState();
    const deltas = pendingDeltas;
    const trades = pendingTrades;
    pendingDeltas = [];
    pendingTrades = [];

    const patch: Partial<MarketBookState> = {};
    if (trades.length > 0) patch.trades = mergeTrades(state.trades, trades);
    if (deltas.length > 0 && state.ready) {
        const asks = new Map(state.asks);
        const bids = new Map(state.bids);
        const lastSeq = apply(asks, bids, deltas, state.lastSeq);
        if (lastSeq !== state.lastSeq) Object.assign(patch, { asks, bids, lastSeq });
    }
    if (Object.keys(patch).length > 0) useMarketBook.setState(patch);
}

function schedule(): void {
    if (frame === 0) frame = requestAnimationFrame(flush);
}

export const marketBook = {
    begin(marketId: string): void {
        this.end();
        useMarketBook.setState({ ...EMPTY, marketId, asks: new Map(), bids: new Map() });
    },
    end(): void {
        if (frame !== 0) cancelAnimationFrame(frame);
        frame = 0;
        recent = [];
        pendingDeltas = [];
        pendingTrades = [];
        useMarketBook.setState(EMPTY);
    },
    snapshot(snapshot: BookSnapshotPayload): void {
        if (snapshot.market_id !== useMarketBook.getState().marketId) return;
        const asks = new Map(snapshot.asks);
        const bids = new Map(snapshot.bids);
        const lastSeq = apply(asks, bids, recent, snapshot.seq);
        pendingDeltas = [];
        useMarketBook.setState({ asks, bids, lastSeq, ready: true });
    },
    delta(delta: BookDelta): void {
        recent.push(delta);
        if (recent.length > RECENT_DELTAS) recent.splice(0, recent.length - RECENT_DELTAS);
        pendingDeltas.push(delta);
        schedule();
    },
    trade(trade: PublicTrade): void {
        pendingTrades.push(trade);
        schedule();
    },
    seedTrades(trades: PublicTrade[]): void {
        useMarketBook.setState({ trades: mergeTrades(useMarketBook.getState().trades, trades) });
    },
};
