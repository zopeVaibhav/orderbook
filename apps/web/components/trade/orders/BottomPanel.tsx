'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OpenOrdersTab from './OpenOrdersTab';
import OrderHistoryTab from './OrderHistoryTab';
import TradesTab from './TradesTab';

type Tab = 'open' | 'trades' | 'history';

export default function BottomPanel() {
    const [active, setActive] = useState<Tab>('open');

    return (
        <div className="flex h-56 shrink-0 flex-col overflow-hidden rounded-md border border-border">
            <Tabs
                value={active}
                onValueChange={(v) => setActive(v as Tab)}
                className="min-h-0 flex-1"
            >
                <TabsList>
                    <TabsTrigger value="open">Open Orders</TabsTrigger>
                    <TabsTrigger value="trades">Trades</TabsTrigger>
                    <TabsTrigger value="history">Order History</TabsTrigger>
                </TabsList>
                <TabsContent value="open" className="flex min-h-0 flex-1 flex-col">
                    <OpenOrdersTab />
                </TabsContent>
                <TabsContent value="trades" className="flex min-h-0 flex-1 flex-col">
                    <TradesTab />
                </TabsContent>
                <TabsContent value="history" className="flex min-h-0 flex-1 flex-col">
                    <OrderHistoryTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
