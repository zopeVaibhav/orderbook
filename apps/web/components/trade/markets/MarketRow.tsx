import Image from 'next/image';
import { formatCompactPrice } from '@/lib/format';
import type { Market } from '@/types/market';

export default function MarketRow({ market }: { market: Market }) {
    const positive = market.change24h >= 0;
    return (
        <div className="flex items-center gap-3 border-b border-border px-3 py-2 hover:bg-muted/50">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                {market.iconSrc ? (
                    <Image src={market.iconSrc} alt={market.name} width={20} height={20} />
                ) : (
                    <span className="text-xs">{market.symbol[0]}</span>
                )}
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="truncate text-sm font-medium">{market.symbol}</span>
                {market.leverage && (
                    <span className="rounded bg-muted px-1 text-[10px] text-muted-foreground">
                        {market.leverage}x
                    </span>
                )}
            </div>
            <div className="text-right text-sm">{formatCompactPrice(market.price)}</div>
            <div className={`w-14 text-right text-xs ${positive ? 'text-profit' : 'text-loss'}`}>
                {positive ? '+' : ''}
                {market.change24h.toFixed(2)}%
            </div>
        </div>
    );
}
