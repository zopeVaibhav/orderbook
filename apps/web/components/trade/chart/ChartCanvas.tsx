'use client';

import { useCandlesStore } from '@/store/market/useCandlesStore';
import CandleChart from './CandleChart';

export default function ChartCanvas() {
    const candles = useCandlesStore((s) => s.candles);
    const timeframe = useCandlesStore((s) => s.timeframe);
    const epoch = useCandlesStore((s) => s.epoch);
    return <CandleChart candles={candles} timeframe={timeframe} epoch={epoch} />;
}
