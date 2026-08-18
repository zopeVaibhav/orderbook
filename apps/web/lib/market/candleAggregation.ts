import { MAX_CANDLES, type Candle } from '@/types/candles';

/**
 * OHLCV aggregation from an executed-trade stream. This is real logic, not mock
 * scaffolding — it keeps working unchanged once trades arrive over the socket
 * instead of from the simulator.
 */

/** Start of the candle bucket containing `tsMs`, in UNIX seconds. */
export function bucketSec(tsMs: number, candleMs: number): number {
    return (Math.floor(tsMs / candleMs) * candleMs) / 1000;
}

/**
 * Fold one executed trade into the window. Extends the forming candle while the
 * trade lands in its bucket, otherwise opens a new candle at the previous close.
 *
 * Bucketing uses the trade's own timestamp (the engine's `ts`), not wall clock,
 * so every client aggregates to identical buckets.
 */
export function rollCandles(
    candles: Candle[],
    price: number,
    quantity: number,
    tsMs: number,
    candleMs: number,
): Candle[] {
    const bucket = bucketSec(tsMs, candleMs);
    const last = candles[candles.length - 1];

    if (!last) {
        return [
            { time: bucket, open: price, high: price, low: price, close: price, volume: quantity },
        ];
    }

    // Out-of-order trades would rewind the series, which the chart rejects.
    if (bucket < last.time) return candles;

    if (bucket > last.time) {
        const open = last.close;
        const grown = [
            ...candles,
            {
                time: bucket,
                open,
                high: Math.max(open, price),
                low: Math.min(open, price),
                close: price,
                volume: quantity,
            },
        ];
        return grown.length > MAX_CANDLES ? grown.slice(grown.length - MAX_CANDLES) : grown;
    }

    return [
        ...candles.slice(0, -1),
        {
            time: last.time,
            open: last.open,
            high: Math.max(last.high, price),
            low: Math.min(last.low, price),
            close: price,
            volume: last.volume + quantity,
        },
    ];
}
