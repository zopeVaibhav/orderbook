'use client';

import { useState } from 'react';
import { useMarketFeed } from '@/hooks/market/useMarketFeed';
import { useKeyboardShortcut } from '@/hooks/ui/useKeyboardShortcut';
import ChartPanel from './chart/ChartPanel';
import MarketsSidebar from './markets/MarketsSidebar';
import OrderBookPanel from './orderbook/OrderBookPanel';
import BottomPanel from './orders/BottomPanel';
import MobileOrderBar from './trade-panel/MobileOrderBar';
import TradePanel from './trade-panel/TradePanel';

export default function TradeShell() {
    const [marketsOpen, setMarketsOpen] = useState(false);
    useMarketFeed();

    const toggleMarkets = () => setMarketsOpen((v) => !v);

    useKeyboardShortcut('mod+b', toggleMarkets);

    return (
        <div className="flex flex-1 flex-col gap-2 p-2 pt-0 lg:min-h-0 lg:flex-row">
            <MarketsSidebar open={marketsOpen} onClose={() => setMarketsOpen(false)} />
            <div className="scrollbar-none flex min-w-0 flex-1 flex-col gap-2 lg:min-h-0 lg:overflow-y-auto">
                <div className="flex shrink-0 flex-col gap-2 md:h-[480px] md:flex-row lg:h-[calc(100%-5rem)]">
                    <ChartPanel onToggleMarkets={toggleMarkets} />
                    <OrderBookPanel />
                </div>
                <BottomPanel />
            </div>
            <TradePanel />
            <MobileOrderBar />
        </div>
    );
}
