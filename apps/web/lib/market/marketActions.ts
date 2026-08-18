import { seedCandleHistory } from '@/lib/market/mockFeed';
import { useCandlesStore } from '@/store/market/useCandlesStore';
import { useTradesStore } from '@/store/market/useTradesStore';
import type { Timeframe } from '@/types/candles';

/**
 * Switch the chart interval.
 *
 * History has to be refetched, not recomputed: a 60-bar window of 5s candles is
 * five minutes of data, which re-buckets into a single 5m candle. Real clients
 * hit a REST history endpoint here; the mock regenerates instead.
 *
 * The new history is anchored to the price currently on screen so the switch
 * does not make the market appear to jump.
 */
export function changeTimeframe(timeframe: Timeframe): void {
    const candles = useCandlesStore.getState();
    const anchor =
        useTradesStore.getState().trades[0]?.price ??
        candles.candles[candles.candles.length - 1]?.close;

    candles.setTimeframe(timeframe);
    candles.seed(seedCandleHistory(Date.now(), timeframe.ms, anchor));
}
