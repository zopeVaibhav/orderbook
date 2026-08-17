'use client';

import { useState } from 'react';
import ChartPanel from './chart/ChartPanel';
import MarketsSidebar from './markets/MarketsSidebar';
import OrderBookPanel from './orderbook/OrderBookPanel';
import BottomPanel from './orders/BottomPanel';
import TradePanel from './trade-panel/TradePanel';

export default function TradeShell() {
    const [marketsOpen, setMarketsOpen] = useState(false);
    return (
        <div className="flex min-h-0 flex-1 gap-2 p-2 pt-0">
            <MarketsSidebar open={marketsOpen} />
            <div className="scrollbar-none flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-y-auto">
                <div className="flex h-[calc(100%-1rem)] shrink-0 gap-2">
                    <ChartPanel onToggleMarkets={() => setMarketsOpen((v) => !v)} />
                    <OrderBookPanel />
                </div>
                <BottomPanel />
            </div>
            <TradePanel />
        </div>
    );
}
