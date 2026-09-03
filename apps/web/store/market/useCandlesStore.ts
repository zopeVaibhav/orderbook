import { create } from 'zustand';
import { rollCandles } from '@/lib/market/candleAggregation';
import { DEFAULT_TIMEFRAME, type Candle, type Timeframe } from '@/types/candles';

interface CandlesState {
    candles: Candle[];
    timeframe: Timeframe;
    epoch: number;
    applyTrade: (price: number, quantity: number, tsMs: number) => void;
    setTimeframe: (timeframe: Timeframe) => void;
    seed: (candles: Candle[]) => void;
}

export const useCandlesStore = create<CandlesState>((set, get) => ({
    candles: [],
    timeframe: DEFAULT_TIMEFRAME,
    epoch: 0,

    applyTrade: (price, quantity, tsMs) =>
        set((s) => ({
            candles: rollCandles(s.candles, price, quantity, tsMs, s.timeframe.ms),
        })),

    setTimeframe: (timeframe) => set({ timeframe }),

    seed: (candles) => set({ candles, epoch: get().epoch + 1 }),
}));
