'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useMarkets } from '@/hooks/market/useMarkets';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { MarketCategory } from '@/types/market';
import MarketRow from './MarketRow';

export default function MarketsSidebar({ open }: { open: boolean }) {
    const [active, setActive] = useState<MarketCategory>('markets');
    const { data: markets, isPending, isError, refetch } = useMarkets();

    const rows = active === 'markets' ? (markets ?? []) : [];

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
                            {active === 'markets' && isPending ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-3 border-b border-border px-3 py-2"
                                    >
                                        <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-muted" />
                                        <div className="h-3 flex-1 animate-pulse rounded bg-muted" />
                                        <div className="h-3 w-12 animate-pulse rounded bg-muted" />
                                    </div>
                                ))
                            ) : active === 'markets' && isError ? (
                                <div className="flex flex-col items-center gap-2 p-4 text-center text-sm text-muted-foreground">
                                    Could not load markets
                                    <button
                                        onClick={() => refetch()}
                                        className="text-xs text-foreground underline underline-offset-2"
                                    >
                                        Retry
                                    </button>
                                </div>
                            ) : rows.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    {active === 'follows' ? 'No follows yet' : 'No markets'}
                                </div>
                            ) : (
                                rows.map((m) => <MarketRow key={m.id} market={m} />)
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
