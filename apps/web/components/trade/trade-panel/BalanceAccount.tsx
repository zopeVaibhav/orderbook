'use client';

import { useParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { availableOf, lockedOf, useBalance } from '@/hooks/balance/useGetBalances';
import { useMarket } from '@/hooks/market/useMarkets';
import { formatUsd } from '@/lib/format';
import type { Side } from '@/types/order';

export default function BalanceAccount({ side }: { side: Side }) {
    const param = useParams<{ market?: string }>();
    const { data: market } = useMarket(param.market);
    const buying = side === 'bid';
    const asset = buying ? market?.quote : market?.symbol;
    const { data: balance } = useBalance(asset);

    const decimals = buying ? 2 : (market?.lotExp ?? 2);
    const amount = (value: number) =>
        value.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });

    const available = buying ? `$${formatUsd(availableOf(balance))}` : amount(availableOf(balance));
    const locked = lockedOf(balance);

    return (
        <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="text-muted-foreground">Available</span>
            <div className="relative h-5 flex-1">
                <AnimatePresence initial={false}>
                    <motion.div
                        key={side}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                        className="absolute inset-0 flex items-baseline justify-end gap-1.5 tabular-nums"
                    >
                        <span className="font-medium text-foreground">
                            {available} {buying ? '' : (asset ?? '')}
                        </span>
                        {locked > 0 && (
                            <span className="text-xs whitespace-nowrap text-muted-foreground">
                                · {amount(locked)} locked
                            </span>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
