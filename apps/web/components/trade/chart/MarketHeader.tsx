'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';

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
    return (
        <div className="relative flex h-16 shrink-0 items-center gap-8 overflow-hidden overflow-x-scroll border-b border-border px-3">
            <Button
                variant="ghost"
                onClick={onToggleMarkets}
                className="absolute left-0 h-10 w-2 min-w-0 rounded-tr-md rounded-br-md rounded-tl-none rounded-bl-none bg-muted p-0 hover:bg-muted/70"
            />

            <div className="ml-2 flex items-center gap-2">
                <Image src="/coins/bitcoin.svg" alt="bitcoin logo" height={20} width={20} />
                <div className="text-xl font-medium">BTC</div>
            </div>
            <Stat label="Mark" value="$64,235.00" tone="positive" />
            <Stat label="Oracle" value="$64,271.30" tone="positive" />
            <Stat label="24h Change" value="+$1,154 / +1.83%" tone="positive" />
            <Stat label="24h Volume" value="$2,112,700,686.77" />
            <Stat label="Open Interest" value="$2,776,000,000" />
        </div>
    );
}
