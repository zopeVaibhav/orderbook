'use client';

import { AnimatePresence, motion } from 'motion/react';
import { availableOf, useBalance } from '@/hooks/balance/useGetBalances';
import { useMarket } from '@/hooks/market/useMarkets';
import { formatUsd } from '@/lib/format';
import type { Side } from '@/types/order';
import { useParams } from 'next/navigation';

export default function BalanceAccount({ side }: { side: Side }) {
    const param = useParams<{ market?: string }>();
    const { data: market } = useMarket(param.market);
    const buying = side === 'bid';
    const asset = buying ? market?.quote : market?.symbol;
    const { data: balance } = useBalance(asset);

    const amount = availableOf(balance);
    const shown = buying
        ? `$${formatUsd(amount)}`
        : `${amount.toLocaleString('en-US', {
              minimumFractionDigits: market?.lotExp ?? 2,
              maximumFractionDigits: market?.lotExp ?? 2,
          })} ${asset ?? ''}`;

    return (
        <div className="flex items-center justify-between p-3">
            <span className="text-xs text-muted-foreground">Available</span>
            <div className="relative h-6 flex-1">
                <AnimatePresence initial={false}>
                    <motion.span
                        key={side}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                        className="absolute inset-0 flex items-center justify-end text-base font-semibold text-foreground tabular-nums"
                    >
                        {shown}
                    </motion.span>
                </AnimatePresence>
            </div>
        </div>
    );
}
