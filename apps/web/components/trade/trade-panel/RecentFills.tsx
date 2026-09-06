'use client';

import { Side } from '@repo/types';
import { useFills } from '@/hooks/orders/useFills';
import { formatPrice, formatSize, formatTime } from '@/lib/format';

const COLUMNS = 'grid grid-cols-[1fr_1fr_1fr_1fr] gap-2';

export default function RecentFills() {
    const { data: fills, isPending } = useFills();
    const rows = fills ?? [];

    return (
        <div className="flex min-h-0 flex-1 flex-col p-3 pt-2">
            <div className="mb-2 text-xs font-semibold text-foreground">Recent Trades</div>
            <div
                className={`${COLUMNS} pb-1.5 text-xs uppercase tracking-wide text-muted-foreground/70`}
            >
                <span>Time</span>
                <span>Symbol</span>
                <span className="text-right">Size</span>
                <span className="text-right">Price</span>
            </div>
            <div className="scrollbar-none flex min-h-0 flex-1 flex-col overflow-y-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {rows.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
                        {isPending ? 'Loading' : 'No trades yet'}
                    </div>
                ) : (
                    rows.map((fill) => (
                        <div
                            key={`${fill.marketId}-${fill.tradeId}`}
                            className={`${COLUMNS} py-1 text-xs`}
                        >
                            <span className="text-muted-foreground">{formatTime(fill.ts)}</span>
                            <span className={fill.side === Side.BID ? 'text-profit' : 'text-loss'}>
                                {fill.base}
                            </span>
                            <span className="text-right text-foreground">
                                {formatSize(parseFloat(fill.quantity))}
                            </span>
                            <span className="text-right text-foreground">
                                ${formatPrice(parseFloat(fill.price))}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
