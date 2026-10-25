import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSharedValue } from 'react-native-reanimated';
import { MarketChart } from '@/components/chart/MarketChart';
import { CoinBadge } from '@/components/market/CoinBadge';
import { LivePrice } from '@/components/market/LivePrice';
import { MarketOverview } from '@/components/market/MarketOverview';
import { MarketTopBar } from '@/components/market/MarketTopBar';
import { OrderBook } from '@/components/market/OrderBook';
import { TradeTape } from '@/components/market/TradeTape';
import { CollapsingScreen } from '@/components/ui/CollapsingScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { StickyTabs } from '@/components/ui/StickyTabs';
import { Text } from '@/components/ui/Text';
import { useMarket } from '@/hooks/queries/useMarkets';
import { useMarketStream } from '@/hooks/useMarketStream';
import { formatChange, formatDelta } from '@/lib/format';
import { useMarketBook } from '@/store/orderbook';
import { usePreferences } from '@/store/preferences';
import { Spacing } from '@/theme';

const TABS = ['Overview', 'Order book', 'Trades'] as const;
type Tab = (typeof TABS)[number];
const REVEAL_AT = 150;

function changeLine(price: number | null, open: number | null, change: number | null): string {
    if (change === null || price === null || !open) return 'No trades in 24h';
    const pct = formatChange(change).replace(/^[+-]/, '');
    return `${formatDelta(price - open, price)} (${pct}) 24H`;
}

export default function MarketScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const market = useMarket(id);
    const stream = useMarketStream(id);
    const lastTrade = useMarketBook((s) => s.trades[0]);
    const pushRecentMarket = usePreferences((s) => s.pushRecentMarket);
    const [tab, setTab] = useState<Tab>('Overview');
    const scrollY = useSharedValue(0);
    const m = market.data;
    const price = lastTrade ? parseFloat(lastTrade.price) : (m?.price ?? null);
    const open = m?.openPrice ?? null;
    const change = price !== null && open ? ((price - open) / open) * 100 : (m?.change24h ?? null);
    const up = (change ?? 0) >= 0;

    useEffect(() => {
        if (id) pushRecentMarket(id);
    }, [id, pushRecentMarket]);

    const header = (
        <View style={styles.header}>
            <CoinBadge symbol={m?.base ?? '?'} size={34} />
            <Text variant="heading">{m ? `${m.name} · ${m.base}/${m.quote}` : ' '}</Text>
            {market.isPending ? (
                <Skeleton width="55%" height={38} />
            ) : (
                <View style={styles.priceBlock}>
                    <LivePrice value={price} variant="display" />
                    <Text
                        variant="smallMedium"
                        tone={change === null ? 'muted' : up ? 'profit' : 'loss'}
                        numeric
                    >
                        {changeLine(price, open, change)}
                    </Text>
                </View>
            )}
            <MarketChart marketId={id} reference={open} />
        </View>
    );

    return (
        <Screen>
            <MarketTopBar
                title={m ? `${m.base}/${m.quote}` : ''}
                price={price}
                change={change}
                scrollY={scrollY}
                revealAt={REVEAL_AT}
            />
            <CollapsingScreen
                header={header}
                tabs={<StickyTabs tabs={TABS} value={tab} onChange={setTab} />}
                contentKey={tab}
                scrollY={scrollY}
                refreshing={stream.isRefreshing}
                onRefresh={() => {
                    void stream.refresh();
                    void market.refetch();
                }}
            >
                {stream.isError ? (
                    <EmptyState
                        title="Market unavailable"
                        message="Could not load this market from the server."
                        actionLabel="Retry"
                        onAction={() => void stream.refresh()}
                    />
                ) : tab === 'Overview' ? (
                    <MarketOverview market={m} price={price} />
                ) : (
                    <View style={styles.pane}>
                        {tab === 'Order book' ? <OrderBook /> : <TradeTape />}
                    </View>
                )}
            </CollapsingScreen>
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, gap: Spacing.sm },
    priceBlock: { gap: 2, marginBottom: Spacing.md },
    pane: { padding: Spacing.lg },
});
