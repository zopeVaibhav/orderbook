type Props = {
    price: number;
    size: number;
    total: number;
    depthPct: number;
    side: 'bid' | 'ask';
};

function fmtPrice(n: number): string {
    return n.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function fmtQty(n: number): string {
    return n.toFixed(5);
}

export default function OrderBookRow({ price, size, total, depthPct, side }: Props) {
    const priceColor = side === 'bid' ? 'text-profit' : 'text-loss';
    const barColor = side === 'bid' ? 'bg-profit/20' : 'bg-loss/20';
    return (
        <div className="relative grid grid-cols-3 px-2 py-0.5 text-xs tabular-nums my-1">
            <div
                className={`absolute inset-y-0 right-0 transition-[width] duration-500 ease-out ${barColor}`}
                style={{ width: `${depthPct}%` }}
            />
            <div className={`relative ${priceColor}`}>{fmtPrice(price)}</div>
            <div className="relative text-right text-foreground">{fmtQty(size)}</div>
            <div className="relative text-right text-foreground">{fmtQty(total)}</div>
        </div>
    );
}
