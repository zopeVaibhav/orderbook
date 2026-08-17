'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MARKETS } from '@/data/markets';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { MarketCategory } from '@/types/market';
import MarketRow from './MarketRow';

export default function MarketsSidebar({ open }: { open: boolean }) {
    const [active, setActive] = useState<MarketCategory>('markets');
    const rows = MARKETS.filter((m) => m.category === active);
    return (
        <AnimatePresence initial={false}>
            {open && (
                <motion.div
                    key="markets-sidebar"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 320, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{
                        width: { duration: 0.19 },
                        opacity: { duration: 0.2, ease: 'easeInOut' },
                    }}
                    className="h-full shrink-0 overflow-hidden"
                >
                    <div className="flex h-full w-[320px] flex-col overflow-hidden rounded-md border border-border">
                        <Tabs value={active} onValueChange={(v) => setActive(v as MarketCategory)}>
                            <TabsList>
                                <TabsTrigger value="markets">Markets</TabsTrigger>
                                <TabsTrigger value="follows">Follows</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto">
                            {rows.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    No markets
                                </div>
                            ) : (
                                rows.map((m) => <MarketRow key={m.symbol} market={m} />)
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
