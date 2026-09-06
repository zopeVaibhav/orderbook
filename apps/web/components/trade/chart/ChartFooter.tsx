'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { changeTimeframe } from '@/lib/market/marketActions';
import { useCandlesStore } from '@/store/market/useCandlesStore';
import { formatTime } from '@/lib/format';
import { TIMEFRAMES } from '@/types/candles';

export default function ChartFooter() {
    const timeframe = useCandlesStore((s) => s.timeframe);
    const [now, setNow] = useState<string | null>(null);

    useEffect(() => {
        const tick = () => setNow(formatTime(Date.now()));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="flex h-9 shrink-0 items-center gap-1 border-t border-border px-3 text-sm">
            {TIMEFRAMES.map((tf) => (
                <Button
                    key={tf.key}
                    variant="ghost"
                    size="xs"
                    onClick={() => changeTimeframe(tf)}
                    className={`${
                        tf.key === timeframe.key
                            ? 'bg-muted font-semibold text-foreground'
                            : 'text-muted-foreground'
                    }`}
                >
                    {tf.key}
                </Button>
            ))}
            <div className="ml-auto flex items-center gap-2 text-muted-foreground tabular-nums">
                {now && <span className="text-foreground">{now}</span>}
                <span>Local</span>
            </div>
        </div>
    );
}
