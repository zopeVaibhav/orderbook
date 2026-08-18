import { useMemo } from 'react';
import { useOrderBookStore } from '@/store/market/useOrderBookStore';

export type BookRow = {
    price: number;
    size: number;
    total: number;
};

export type CumulativeBook = {
    /** Highest ask first, so the best ask sits nearest the spread row. */
    asks: BookRow[];
    /** Highest bid first — the best bid also sits nearest the spread. */
    bids: BookRow[];
    maxTotal: number;
    bestAsk: number | null;
    bestBid: number | null;
    /** Share of displayed depth resting on each side. */
    buyPct: number;
    sellPct: number;
};

/**
 * Turns the raw price maps into the render shape: sorted, depth-limited and
 * cumulated outward from the spread. Derived per render rather than stored, so
 * there is one source of truth for the book.
 */
export function useCumulativeBook(depth: number): CumulativeBook {
    const asks = useOrderBookStore((s) => s.asks);
    const bids = useOrderBookStore((s) => s.bids);

    return useMemo(() => {
        const toSorted = (levels: Map<string, string>, ascending: boolean) =>
            [...levels.entries()]
                .map(([price, size]) => ({ price: parseFloat(price), size: parseFloat(size) }))
                .sort((a, b) => (ascending ? a.price - b.price : b.price - a.price));

        // Best price first on each side, so cumulative totals grow away from the spread.
        const asksFromBest = toSorted(asks, true).slice(0, depth);
        const bidsFromBest = toSorted(bids, false).slice(0, depth);

        const cumulate = (rows: { price: number; size: number }[]): BookRow[] => {
            let running = 0;
            return rows.map((r) => {
                running += r.size;
                return { ...r, total: running };
            });
        };

        const asksCum = cumulate(asksFromBest);
        const bidsCum = cumulate(bidsFromBest);

        const askDepth = asksCum[asksCum.length - 1]?.total ?? 0;
        const bidDepth = bidsCum[bidsCum.length - 1]?.total ?? 0;
        const totalDepth = askDepth + bidDepth;

        return {
            // Reversed for display: worst ask at the top, best ask against the spread.
            asks: [...asksCum].reverse(),
            bids: bidsCum,
            maxTotal: Math.max(askDepth, bidDepth) || 1,
            bestAsk: asksFromBest[0]?.price ?? null,
            bestBid: bidsFromBest[0]?.price ?? null,
            buyPct: totalDepth ? Math.round((bidDepth / totalDepth) * 100) : 50,
            sellPct: totalDepth ? 100 - Math.round((bidDepth / totalDepth) * 100) : 50,
        };
    }, [asks, bids, depth]);
}
