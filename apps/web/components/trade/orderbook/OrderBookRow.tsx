export type FillPart = 'price' | 'size' | 'total';

type Props = {
    price: number;
    size: number;
    total: number;
    depthPct: number;
    side: 'bid' | 'ask';
    priceDp: number;
    sizeDp: number;
    onFill?: (part: FillPart) => void;
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
    onFill,
}: Props) {
    const priceColor = side === 'bid' ? 'text-profit' : 'text-loss';
    const barColor = side === 'bid' ? 'bg-profit/20' : 'bg-loss/20';
    const cell = onFill ? 'cursor-pointer' : '';

    const fill = (part: FillPart) => () => onFill?.(part);
    const label = (part: FillPart) =>
        `Fill ${part === 'price' ? 'price' : `price and ${part}`} from ${fixed(price, priceDp)}`;

    return (
        <div
            className={`relative grid grid-cols-3 px-2 py-0.5 text-xs tabular-nums my-0.5 ${
                onFill ? 'hover:bg-muted/40' : ''
            }`}
        >
            <div
                className={`absolute inset-y-0 right-0 transition-[width] duration-500 ease-out ${barColor}`}
                style={{ width: `${depthPct}%` }}
            />
            <button
                type="button"
                onClick={fill('price')}
                aria-label={label('price')}
                className={`relative text-left ${priceColor} ${cell}`}
            >
                {fixed(price, priceDp)}
            </button>
            <button
                type="button"
                onClick={fill('size')}
                aria-label={label('size')}
                className={`relative text-right text-foreground ${cell}`}
            >
                {fixed(size, sizeDp)}
            </button>
            <button
                type="button"
                onClick={fill('total')}
                aria-label={label('total')}
                className={`relative text-right text-foreground ${cell}`}
            >
                {fixed(total, sizeDp)}
            </button>
        </div>
    );
}
