import type { CandleInterval } from '@repo/types';

export interface IntervalOption {
    key: CandleInterval;
    label: string;
    ms: number;
}

export const INTERVALS: IntervalOption[] = [
    { key: '5s', label: '5s', ms: 5_000 },
    { key: '1m', label: '1m', ms: 60_000 },
    { key: '5m', label: '5m', ms: 300_000 },
    { key: '15m', label: '15m', ms: 900_000 },
    { key: '1h', label: '1H', ms: 3_600_000 },
    { key: '1d', label: '1D', ms: 86_400_000 },
];

export const DEFAULT_INTERVAL: IntervalOption = INTERVALS[1] ?? {
    key: '1m',
    label: '1m',
    ms: 60_000,
};

export const CANDLE_LIMIT = 300;
