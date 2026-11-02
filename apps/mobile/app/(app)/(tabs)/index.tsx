import { useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { ExploreTab } from '@/components/home/ExploreTab';
import { HoldingsTab } from '@/components/home/HoldingsTab';
import { OrdersTab } from '@/components/home/OrdersTab';
import { TickerStrip } from '@/components/market/TickerStrip';
import { AppHeader } from '@/components/ui/AppHeader';
import { CollapsingScreen } from '@/components/ui/CollapsingScreen';
import { Screen } from '@/components/ui/Screen';
import { StickyTabs } from '@/components/ui/StickyTabs';
import { SwipePager } from '@/components/ui/SwipePager';
import { useOpenOrders, usePortfolio } from '@/hooks/queries/useAccount';
import { useMarkets } from '@/hooks/queries/useMarkets';

const TABS = ['Explore', 'Holdings', 'Orders'] as const;
const PAGES = [
    <ExploreTab key="explore" />,
    <HoldingsTab key="holdings" />,
    <OrdersTab key="orders" />,
];

export default function HomeScreen() {
    const markets = useMarkets();
    const portfolio = usePortfolio();
    const orders = useOpenOrders();
    const [index, setIndex] = useState(0);
    const progress = useSharedValue(0);

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
                tabs={
                    <StickyTabs
                        tabs={TABS}
                        value={TABS[index] ?? TABS[0]}
                        onChange={(tab) => setIndex(TABS.indexOf(tab))}
                        progress={progress}
                    />
                }
                contentKey={String(index)}
                refreshing={markets.isRefetching}
                onRefresh={onRefresh}
            >
                <SwipePager
                    index={index}
                    onIndexChange={setIndex}
                    pages={PAGES}
                    progress={progress}
                />
            </CollapsingScreen>
        </Screen>
    );
}
