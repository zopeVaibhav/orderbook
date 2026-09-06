'use client';

import { motion } from 'motion/react';
import { TOP_MOVERS } from '@/data/top-movers';
import { formatPrice } from '@/lib/format';

function TickerItem({
    symbol,
    price,
    change24h,
}: {
    symbol: string;
    price: number;
    change24h: number;
}) {
    const positive = change24h >= 0;
    return (
        <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
            <span className="text-foreground">{symbol}</span>
            <span className={positive ? 'text-profit' : 'text-loss'}>${formatPrice(price)}</span>
            <span className={positive ? 'text-profit/70' : 'text-loss/70'}>
                ({change24h.toFixed(2)}%)
            </span>
        </div>
    );
}

export default function StatusBar() {
    return (
        <div className="flex h-8 shrink-0 items-center gap-4 border-t border-border bg-muted/30 px-3 text-xs text-muted-foreground">
            <div className="flex shrink-0 items-center gap-1.5 font-semibold text-foreground">
                <span>Top Movers</span>
            </div>
            <div className="group min-w-0 flex-1 overflow-hidden">
                <motion.div
                    className="flex w-max gap-6 group-hover:paused"
                    animate={{ x: ['0%', '-50%'] }}
                    transition={{
                        duration: 40,
                        ease: 'linear',
                        repeat: Infinity,
                    }}
                >
                    {[...TOP_MOVERS, ...TOP_MOVERS].map((m, i) => (
                        <TickerItem key={`${m.symbol}-${i}`} {...m} />
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
