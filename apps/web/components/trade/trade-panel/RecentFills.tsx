import { USER_FILLS, formatFillTime } from '@/data/user-fills';

function formatSize(n: number): string {
    if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (n >= 1) return n.toFixed(3);
    return n.toFixed(4);
}

function formatPrice(n: number): string {
    if (n >= 100)
        return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (n >= 1) return n.toFixed(4);
    return n.toFixed(6);
}

export default function RecentFills() {
    return (
        <div className="flex min-h-0 flex-1 flex-col p-3 pt-2">
            <div className="mb-2 text-xs font-semibold text-foreground">Recent Trades</div>
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-2 pb-1.5 text-xs uppercase tracking-wide text-muted-foreground/70">
                <span>Time</span>
                <span>Symbol</span>
                <span className="text-right">Size</span>
                <span className="text-right">Price</span>
            </div>
            <div className="scrollbar-none flex min-h-0 flex-1 flex-col overflow-y-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {USER_FILLS.map((f) => (
                    <div key={f.id} className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-2 py-1 text-xs">
                        <span className="text-muted-foreground">{formatFillTime(f.timestamp)}</span>
                        <span className={f.side === 'bid' ? 'text-profit' : 'text-loss'}>
                            {f.symbol}
                        </span>
                        <span className="text-right text-foreground">{formatSize(f.size)}</span>
                        <span className="text-right text-foreground">${formatPrice(f.price)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
