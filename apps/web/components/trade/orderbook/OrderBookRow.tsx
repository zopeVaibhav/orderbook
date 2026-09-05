type Props = {
    price: number;
    size: number;
    total: number;
    depthPct: number;
    side: 'bid' | 'ask';
    priceDp: number;
    sizeDp: number;
};

function fixed(n: number, dp: number): string {
    return n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

export default function OrderBookRow({
    price,
    size,
    total,
    depthPct,
    side,
    priceDp,
    sizeDp,
}: Props) {
    const priceColor = side === 'bid' ? 'text-profit' : 'text-loss';
    const barColor = side === 'bid' ? 'bg-profit/20' : 'bg-loss/20';
    return (
        <div className="relative grid grid-cols-3 px-2 py-0.5 text-xs tabular-nums my-1">
            <div
                className={`absolute inset-y-0 right-0 transition-[width] duration-500 ease-out ${barColor}`}
                style={{ width: `${depthPct}%` }}
            />
            <div className={`relative ${priceColor}`}>{fixed(price, priceDp)}</div>
            <div className="relative text-right text-foreground">{fixed(size, sizeDp)}</div>
            <div className="relative text-right text-foreground">{fixed(total, sizeDp)}</div>
        </div>
    );
}
