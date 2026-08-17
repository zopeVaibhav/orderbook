'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Tab = 'book' | 'trades';

export default function OrderBookPanel() {
    const [active, setActive] = useState<Tab>('book');
    return (
        <div className="flex w-[320px] shrink-0 flex-col overflow-hidden rounded-md border border-border">
            <Tabs value={active} onValueChange={(v) => setActive(v as Tab)}>
                <TabsList>
                    <TabsTrigger value="book">Order Book</TabsTrigger>
                    <TabsTrigger value="trades">Trades</TabsTrigger>
                </TabsList>
            </Tabs>
            {active === 'book' ? (
                <>
                    <div className="flex shrink-0 items-center p-2 text-sm">
                        <div className="flex-1 text-muted-foreground">Price</div>
                        <div className="flex-1 text-right text-muted-foreground">Size</div>
                        <div className="flex-1 text-right text-muted-foreground">Total</div>
                    </div>
                    <div className="min-h-0 flex-1 overflow-auto"></div>
                    <div className="flex h-8 shrink-0 items-center justify-between border-y border-border px-3">
                        <div className="text-sm">22.0000</div>
                        <div className="text-xs">Recenter</div>
                    </div>
                    <div className="min-h-0 flex-1 overflow-auto"></div>
                </>
            ) : (
                <div className="flex min-h-0 flex-1 justify-between overflow-auto p-2 text-sm text-muted-foreground">
                    <div>Price (USD)</div>
                    <div>Qty (BTC)</div>
                    <div>UTC</div>
                </div>
            )}
        </div>
    );
}
