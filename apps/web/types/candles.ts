export type Candle = {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};

export type TimeframeKey = '1s' | '5s' | '15s' | '30s' | '1m' | '5m';

export type Timeframe = {
    key: TimeframeKey;
    ms: number;
};

export const TIMEFRAMES: Timeframe[] = [
    { key: '1s', ms: 1_000 },
    { key: '5s', ms: 5_000 },
    { key: '15s', ms: 15_000 },
    { key: '30s', ms: 30_000 },
    { key: '1m', ms: 60_000 },
    { key: '5m', ms: 300_000 },
];

export const DEFAULT_TIMEFRAME: Timeframe = TIMEFRAMES[1]!;

export const MAX_CANDLES = 120;
