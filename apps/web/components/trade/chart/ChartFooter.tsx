'use client';

import { Button } from '@/components/ui/button';
import { changeTimeframe } from '@/lib/market/marketActions';
import { useCandlesStore } from '@/store/market/useCandlesStore';
import { TIMEFRAMES } from '@/types/candles';

export default function ChartFooter() {
    // Selector, so price ticks do not re-render the toolbar.
    const timeframe = useCandlesStore((s) => s.timeframe);

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
            {/* Axis renders in the viewer's zone, so labelling it UTC would lie. */}
            <div className="ml-auto text-muted-foreground">Local</div>
        </div>
    );
}
