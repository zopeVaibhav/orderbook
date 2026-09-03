import { MAX_CANDLES, type Candle } from '@/types/candles';

export function bucketSec(tsMs: number, candleMs: number): number {
    return (Math.floor(tsMs / candleMs) * candleMs) / 1000;
}

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
