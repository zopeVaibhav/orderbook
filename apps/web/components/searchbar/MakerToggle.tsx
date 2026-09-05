'use client';

import { useToggleMaker } from '@/hooks/market/useToggleMaker';
import type { Market } from '@/types/market';

export default function MakerToggle({ market }: { market: Market }) {
    const toggle = useToggleMaker();
    const on = market.makerEnabled;

    return (
        <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={`Simulated liquidity for ${market.symbol}`}
            title={on ? 'Simulated liquidity on' : 'Simulated liquidity off'}
            disabled={toggle.isPending}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
                e.stopPropagation();
                toggle.mutate({ marketId: market.id, enabled: !on });
            }}
            className={`relative h-4 w-7 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                on ? 'bg-profit' : 'bg-muted-foreground/40'
            }`}
        >
            <span
                className={`absolute top-0.5 size-3 rounded-full bg-background transition-[left] ${
                    on ? 'left-3.5' : 'left-0.5'
                }`}
            />
        </button>
    );
}
