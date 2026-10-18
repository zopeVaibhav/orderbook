import { useState } from 'react';
import { ExploreTab } from '@/components/home/ExploreTab';
import { HoldingsTab } from '@/components/home/HoldingsTab';
import { OrdersTab } from '@/components/home/OrdersTab';
import { TickerStrip } from '@/components/market/TickerStrip';
import { AppHeader } from '@/components/ui/AppHeader';
import { CollapsingScreen } from '@/components/ui/CollapsingScreen';
import { Screen } from '@/components/ui/Screen';
import { StickyTabs } from '@/components/ui/StickyTabs';
import { useOpenOrders, usePortfolio } from '@/hooks/queries/useAccount';
import { useMarkets } from '@/hooks/queries/useMarkets';

const TABS = ['Explore', 'Holdings', 'Orders'] as const;
type HomeTab = (typeof TABS)[number];

const CONTENT: Record<HomeTab, () => React.JSX.Element> = {
    Explore: ExploreTab,
    Holdings: HoldingsTab,
    Orders: OrdersTab,
};

export default function HomeScreen() {
    const markets = useMarkets();
    const portfolio = usePortfolio();
    const orders = useOpenOrders();
    const [tab, setTab] = useState<HomeTab>('Explore');
    const Content = CONTENT[tab];

    const onRefresh = () => {
        void markets.refetch();
        void portfolio.refetch();
        void orders.refetch();
    };

    return (
        <Screen>
            <CollapsingScreen
                header={
                    <>
                        <AppHeader title="Markets" />
                        <TickerStrip />
                    </>
                }
                tabs={<StickyTabs tabs={TABS} value={tab} onChange={setTab} />}
                contentKey={tab}
                refreshing={markets.isRefetching}
                onRefresh={onRefresh}
            >
                <Content />
            </CollapsingScreen>
        </Screen>
    );
}
