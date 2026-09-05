'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Tab = 'positions' | 'trades' | 'funding' | 'orders';

export default function BottomPanel() {
    const [active, setActive] = useState<Tab>('positions');
    return (
        <div className="flex h-56 shrink-0 flex-col overflow-hidden rounded-md border border-border">
            <Tabs value={active} onValueChange={(v) => setActive(v as Tab)}>
                <TabsList>
                    <TabsTrigger value="positions">Positions (0)</TabsTrigger>
                    <TabsTrigger value="trades">Trades</TabsTrigger>
                    <TabsTrigger value="orders">Order History</TabsTrigger>
                </TabsList>
            </Tabs>
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                EmptyState
            </div>
        </div>
    );
}
