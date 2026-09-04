'use client';

import { useParams } from 'next/navigation';
import { useMarket } from '@/hooks/market/useMarkets';
import { useCandlesStore } from '@/store/market/useCandlesStore';
import CandleChart from './CandleChart';

export default function ChartCanvas() {
    const params = useParams<{ market?: string }>();
    const { data: market } = useMarket(params?.market);
    const candles = useCandlesStore((s) => s.candles);
    const timeframe = useCandlesStore((s) => s.timeframe);
    const epoch = useCandlesStore((s) => s.epoch);
    return (
        <CandleChart
            candles={candles}
            timeframe={timeframe}
            epoch={epoch}
            symbol={market?.symbol ?? ''}
        />
    );
}
