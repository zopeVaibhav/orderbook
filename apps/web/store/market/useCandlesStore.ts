import { create } from 'zustand';
import { rollCandles } from '@/lib/market/candleAggregation';
import { DEFAULT_TIMEFRAME, type Candle, type Timeframe } from '@/types/candles';

interface CandlesState {
    candles: Candle[];
    timeframe: Timeframe;
    /** Bumped whenever the series is replaced wholesale (seed or timeframe switch). */
    epoch: number;
    applyTrade: (price: number, quantity: number, tsMs: number) => void;
    setTimeframe: (timeframe: Timeframe) => void;
    seed: (candles: Candle[]) => void;
}

/**
 * Candles are built from executed trades, not from the book mid — that is what
 * an OHLCV bar means, and it is where volume comes from.
 */
export const useCandlesStore = create<CandlesState>((set, get) => ({
    candles: [],
    timeframe: DEFAULT_TIMEFRAME,
    epoch: 0,

    applyTrade: (price, quantity, tsMs) =>
        set((s) => ({
            candles: rollCandles(s.candles, price, quantity, tsMs, s.timeframe.ms),
        })),

    // Only records the interval. Fresh history is supplied separately via seed(),
    // because re-bucketing what we already hold cannot invent bars we never saw:
    // 60 x 5s is 5 minutes, which is one 5m candle. Use changeTimeframe() in
    // lib/market/marketActions rather than calling this directly.
    setTimeframe: (timeframe) => set({ timeframe }),

    seed: (candles) => set({ candles, epoch: get().epoch + 1 }),
}));
