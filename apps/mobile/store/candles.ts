import { create } from 'zustand';
import type { ApiCandle } from '@repo/types';
import type { PublicTrade } from '@repo/types/socket';
import { CANDLE_LIMIT } from '@/lib/chart/intervals';

export interface Candle {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

interface CandleState {
    key: string | null;
    intervalMs: number;
    candles: Candle[];
}

export const useCandles = create<CandleState>(() => ({ key: null, intervalMs: 0, candles: [] }));

let pending: PublicTrade[] = [];
let frame = 0;

function roll(candles: Candle[], trade: PublicTrade, intervalMs: number): Candle[] {
    const price = parseFloat(trade.price);
    const quantity = parseFloat(trade.quantity);
    const bucket = Math.floor(trade.ts / intervalMs) * intervalMs;
    const last = candles[candles.length - 1];

    if (!last || bucket > last.time) {
        const next = [
            ...candles,
            { time: bucket, open: price, high: price, low: price, close: price, volume: quantity },
        ];
        return next.length > CANDLE_LIMIT ? next.slice(next.length - CANDLE_LIMIT) : next;
    }
    if (bucket < last.time) return candles;

    return [
        ...candles.slice(0, -1),
        {
            ...last,
            high: Math.max(last.high, price),
            low: Math.min(last.low, price),
            close: price,
            volume: last.volume + quantity,
        },
    ];
}

function flush(): void {
    frame = 0;
    const trades = pending;
    pending = [];
    const { candles, intervalMs } = useCandles.getState();
    if (intervalMs === 0 || trades.length === 0) return;
    let next = candles;
    for (const trade of trades) next = roll(next, trade, intervalMs);
    if (next !== candles) useCandles.setState({ candles: next });
}

export const candleFeed = {
    begin(key: string, intervalMs: number): void {
        this.end();
        useCandles.setState({ key, intervalMs, candles: [] });
    },
    end(): void {
        if (frame !== 0) cancelAnimationFrame(frame);
        frame = 0;
        pending = [];
        useCandles.setState({ key: null, intervalMs: 0, candles: [] });
    },
    seed(key: string, rows: ApiCandle[]): void {
        const state = useCandles.getState();
        if (state.key !== key) return;
        const seeded = rows.map((r) => ({
            time: r.time,
            open: parseFloat(r.open),
            high: parseFloat(r.high),
            low: parseFloat(r.low),
            close: parseFloat(r.close),
            volume: parseFloat(r.volume),
        }));
        const lastSeeded = seeded[seeded.length - 1]?.time ?? -Infinity;
        const live = state.candles.filter((c) => c.time > lastSeeded);
        useCandles.setState({ candles: [...seeded, ...live].slice(-CANDLE_LIMIT) });
    },
    trade(trade: PublicTrade): void {
        pending.push(trade);
        if (frame === 0) frame = requestAnimationFrame(flush);
    },
};
