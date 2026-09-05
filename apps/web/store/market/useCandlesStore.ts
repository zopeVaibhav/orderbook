import { create } from 'zustand';
import { rollCandles } from '@/lib/market/candleAggregation';
import { DEFAULT_TIMEFRAME, type Candle, type Timeframe } from '@/types/candles';

export type RawTrade = { price: number; quantity: number; ts: number };

const MAX_TRADE_HISTORY = 5000;

function buildCandles(history: RawTrade[], candleMs: number): Candle[] {
    return history.reduce<Candle[]>(
        (candles, t) => rollCandles(candles, t.price, t.quantity, t.ts, candleMs),
        [],
    );
}

interface CandlesState {
    candles: Candle[];
    history: RawTrade[];
    timeframe: Timeframe;
    epoch: number;
    applyTrade: (price: number, quantity: number, tsMs: number) => void;
    setTimeframe: (timeframe: Timeframe) => void;
    seedHistory: (history: RawTrade[]) => void;
    reset: () => void;
}

export const useCandlesStore = create<CandlesState>((set, get) => ({
    candles: [],
    history: [],
    timeframe: DEFAULT_TIMEFRAME,
    epoch: 0,

    applyTrade: (price, quantity, tsMs) =>
        set((s) => {
            const history = [...s.history, { price, quantity, ts: tsMs }];
            return {
                history:
                    history.length > MAX_TRADE_HISTORY
                        ? history.slice(history.length - MAX_TRADE_HISTORY)
                        : history,
                candles: rollCandles(s.candles, price, quantity, tsMs, s.timeframe.ms),
            };
        }),

    setTimeframe: (timeframe) =>
        set((s) => ({
            timeframe,
            candles: buildCandles(s.history, timeframe.ms),
            epoch: s.epoch + 1,
        })),

    seedHistory: (fetched) =>
        set((s) => {
            const oldestKnown = s.history[0]?.ts;
            const merged =
                oldestKnown === undefined
                    ? fetched
                    : [...fetched.filter((t) => t.ts < oldestKnown), ...s.history];
            const history = merged.slice(-MAX_TRADE_HISTORY);

            return {
                history,
                candles: buildCandles(history, s.timeframe.ms),
                epoch: s.epoch + 1,
            };
        }),

    reset: () => set({ candles: [], history: [], epoch: get().epoch + 1 }),
}));
