'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrders } from '@/hooks/orders/useOrders';
import OpenOrdersTab from './OpenOrdersTab';

type Tab = 'open' | 'trades' | 'history';

export default function BottomPanel() {
    const [active, setActive] = useState<Tab>('open');
    const { data: openOrders } = useOrders('open');

    return (
        <div className="flex h-56 shrink-0 flex-col overflow-hidden rounded-md border border-border">
            <Tabs
                value={active}
                onValueChange={(v) => setActive(v as Tab)}
                className="min-h-0 flex-1"
            >
                <TabsList>
                    <TabsTrigger value="open">Open Orders ({openOrders?.length ?? 0})</TabsTrigger>
                    <TabsTrigger value="trades">Trades</TabsTrigger>
                    <TabsTrigger value="history">Order History</TabsTrigger>
                </TabsList>
                <TabsContent value="open" className="flex min-h-0 flex-1 flex-col">
                    <OpenOrdersTab />
                </TabsContent>
                <TabsContent value="trades" className="flex min-h-0 flex-1 flex-col">
                    <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                        EmptyState
                    </div>
                </TabsContent>
                <TabsContent value="history" className="flex min-h-0 flex-1 flex-col">
                    <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                        EmptyState
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
