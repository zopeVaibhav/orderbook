'use client';

import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { formatChange, formatCompactPrice } from '@/lib/format';
import { useCumulativeBook } from '@/hooks/orderbook/useCumulativeBook';
import { useMarketWithStats } from '@/hooks/market/useMarkets';
import { useTradesStore } from '@/store/market/useTradesStore';

function Stat({
    label,
    value,
    tone = 'default',
}: {
    label: string;
    value: string;
    tone?: 'default' | 'positive' | 'negative';
}) {
    const valueClass =
        tone === 'positive' ? 'text-profit' : tone === 'negative' ? 'text-loss' : 'text-foreground';
    return (
        <div className="flex shrink-0 flex-col leading-tight whitespace-nowrap">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className={`text-sm font-medium ${valueClass}`}>{value}</span>
        </div>
    );
}

export default function MarketHeader({ onToggleMarkets }: { onToggleMarkets: () => void }) {
    const params = useParams<{ market?: string }>();
    const { data: market } = useMarketWithStats(params?.market);
    const lastTrade = useTradesStore((s) => s.trades[0]);
    const { bestAsk, bestBid } = useCumulativeBook(1);

    const priceDp = market?.tickExp ?? 2;
    const mark =
        lastTrade?.price ?? (bestAsk !== null && bestBid !== null ? (bestAsk + bestBid) / 2 : null);
    const spread = bestAsk !== null && bestBid !== null ? bestAsk - bestBid : null;

    const asPrice = (value: number) =>
        `$${value.toLocaleString('en-US', {
            minimumFractionDigits: priceDp,
            maximumFractionDigits: priceDp,
        })}`;

    return (
        <div className="relative flex h-16 shrink-0 items-center gap-8 overflow-hidden overflow-x-scroll border-b border-border px-3">
            <Button
                variant="ghost"
                onClick={onToggleMarkets}
                className="absolute left-0 h-10 w-2 min-w-0 rounded-tr-md rounded-br-md rounded-tl-none rounded-bl-none border-0 bg-muted p-0 hover:bg-muted/70"
            />

            <div className="ml-2 flex items-center gap-2">
                {market?.iconSrc ? (
                    <Image
                        src={market.iconSrc}
                        alt={`${market.name} logo`}
                        height={20}
                        width={20}
                    />
                ) : (
                    <div className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                        {market?.symbol.slice(0, 1) ?? '?'}
                    </div>
                )}
                <div className="text-xl font-medium">{market?.symbol ?? '—'}</div>
                {market && (
                    <span className="rounded bg-muted px-1 text-[10px] text-muted-foreground">
                        {market.quote}
                    </span>
                )}
            </div>
            <Stat
                label="Mark"
                value={mark === null ? '—' : asPrice(mark)}
                tone={lastTrade?.side === 'ASK' ? 'negative' : 'positive'}
            />
            <Stat label="Best Bid" value={bestBid === null ? '—' : asPrice(bestBid)} />
            <Stat label="Best Ask" value={bestAsk === null ? '—' : asPrice(bestAsk)} />
            <Stat label="Spread" value={spread === null ? '—' : asPrice(spread)} />
            <Stat
                label="24h Change"
                value={market?.change24h === undefined ? '—' : formatChange(market.change24h)}
                tone={(market?.change24h ?? 0) >= 0 ? 'positive' : 'negative'}
            />
            <Stat
                label="24h Volume"
                value={market?.volume24h === undefined ? '—' : formatCompactPrice(market.volume24h)}
            />
        </div>
    );
}
