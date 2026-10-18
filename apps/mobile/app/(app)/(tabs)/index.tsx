import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChangePill } from '@/components/market/ChangePill';
import { CoinBadge } from '@/components/market/CoinBadge';
import { LivePrice } from '@/components/market/LivePrice';
import { MarketRow } from '@/components/market/MarketRow';
import { TickerStrip } from '@/components/market/TickerStrip';
import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { CollapsingScreen } from '@/components/ui/CollapsingScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { StickyTabs } from '@/components/ui/StickyTabs';
import { Text } from '@/components/ui/Text';
import { usePortfolio, type Holding } from '@/hooks/queries/useAccount';
import { useMarkets, type Market } from '@/hooks/queries/useMarkets';
import { formatSize, formatUsd } from '@/lib/format';
import { Radius, Spacing, useTheme } from '@/theme';

const MOVERS = 6;
const POPULAR = 5;

function openMarket(id: string) {
    router.push({ pathname: '/market/[id]', params: { id } });
}

function PortfolioCard() {
    const { colors } = useTheme();
    const { data, isPending } = usePortfolio();

    return (
        <Card style={styles.portfolio}>
            <Text variant="caption" tone="muted">
                PORTFOLIO VALUE
            </Text>
            {isPending || !data ? (
                <Skeleton width="60%" height={38} />
            ) : (
                <View style={styles.valueRow}>
                    <Text variant="display" numeric>
                        {formatUsd(data.total)}
                    </Text>
                    <Text variant="bodyMedium" tone="muted">
                        USDC
                    </Text>
                </View>
            )}
            {data && data.change24h !== null ? (
                <View style={styles.valueRow}>
                    <ChangePill value={data.change24h} solid />
                    <Text variant="small" tone="muted">
                        holdings, 24h
                    </Text>
                </View>
            ) : null}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.split}>
                <View style={styles.splitCell}>
                    <Text variant="small" tone="muted">
                        Available
                    </Text>
                    <Text variant="bodyMedium" numeric>
                        {data ? formatUsd(data.cash) : '—'}
                    </Text>
                </View>
                <View style={[styles.splitRule, { backgroundColor: colors.border }]} />
                <View style={styles.splitCell}>
                    <Text variant="small" tone="muted">
                        In orders
                    </Text>
                    <Text variant="bodyMedium" numeric>
                        {data ? formatUsd(data.inOrders) : '—'}
                    </Text>
                </View>
            </View>
        </Card>
    );
}

function MoverCard({ market }: { market: Market }) {
    const { colors } = useTheme();
    return (
        <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`${market.base} ${market.quote}`}
            onPress={() => openMarket(market.id)}
            style={[styles.mover, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
            <CoinBadge symbol={market.base} size={32} />
            <Text variant="bodyMedium">{market.base}</Text>
            <LivePrice value={market.price} variant="small" />
            <ChangePill value={market.change24h} solid />
        </PressableScale>
    );
}

function HoldingRow({ holding }: { holding: Holding }) {
    return (
        <PressableScale
            accessibilityRole="button"
            disabled={!holding.marketId}
            onPress={() => holding.marketId && openMarket(holding.marketId)}
            style={styles.holding}
        >
            <CoinBadge symbol={holding.asset} size={36} />
            <View style={styles.flex}>
                <Text variant="bodyMedium">{holding.asset}</Text>
                <Text variant="small" tone="muted" numeric>
                    {formatSize(holding.quantity)} {holding.asset}
                </Text>
            </View>
            <View style={styles.end}>
                <Text variant="bodyMedium" numeric>
                    {holding.value === null ? '—' : formatUsd(holding.value)}
                </Text>
                <ChangePill value={holding.change24h} />
            </View>
        </PressableScale>
    );
}

const TABS = ['Explore', 'Holdings', 'Orders'] as const;
type HomeTab = (typeof TABS)[number];

function ExploreTab() {
    const markets = useMarkets();

    const movers = useMemo(
        () =>
            (markets.data ?? [])
                .filter((m) => m.change24h !== null)
                .sort((a, b) => Math.abs(b.change24h ?? 0) - Math.abs(a.change24h ?? 0))
                .slice(0, MOVERS),
        [markets.data],
    );

    const popular = useMemo(
        () =>
            [...(markets.data ?? [])]
                .sort((a, b) => (b.volume24h ?? -1) - (a.volume24h ?? -1))
                .slice(0, POPULAR),
        [markets.data],
    );

    return (
        <View style={styles.tabBody}>
            <Animated.View entering={FadeInDown.duration(320)} style={styles.section}>
                <SectionHeader title="Top movers" />
                {markets.isPending ? (
                    <View style={styles.moverRow}>
                        {[0, 1, 2].map((i) => (
                            <Skeleton key={i} width={132} height={128} radius={Radius.xl} />
                        ))}
                    </View>
                ) : movers.length === 0 ? (
                    <Text tone="muted">No trades in the last 24 hours yet.</Text>
                ) : (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.moverRow}
                        style={styles.bleed}
                    >
                        {movers.map((m) => (
                            <MoverCard key={m.id} market={m} />
                        ))}
                    </ScrollView>
                )}
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(80).duration(320)} style={styles.section}>
                <SectionHeader
                    title="Popular markets"
                    actionLabel="See all"
                    onAction={() => router.navigate('/markets')}
                />
                {markets.isError ? (
                    <EmptyState
                        title="Markets unavailable"
                        message="Could not reach the server."
                        actionLabel="Retry"
                        onAction={() => void markets.refetch()}
                    />
                ) : (
                    popular.map((m) => <MarketRow key={m.id} market={m} />)
                )}
            </Animated.View>
        </View>
    );
}

function HoldingsTab() {
    const portfolio = usePortfolio();

    return (
        <View style={styles.tabBody}>
            <Animated.View entering={FadeInDown.duration(320)}>
                <PortfolioCard />
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(80).duration(320)} style={styles.section}>
                {portfolio.data && portfolio.data.holdings.length > 0 ? (
                    portfolio.data.holdings.map((h) => <HoldingRow key={h.asset} holding={h} />)
                ) : (
                    <EmptyState
                        title="No holdings yet"
                        message="Buy into a market and it will show up here."
                        actionLabel="Browse markets"
                        onAction={() => router.navigate('/markets')}
                    />
                )}
            </Animated.View>
        </View>
    );
}

function OrdersTab() {
    return (
        <View style={styles.tabBody}>
            <EmptyState
                title="No open orders"
                message="Orders resting on the book will show up here."
            />
        </View>
    );
}

export default function HomeScreen() {
    const markets = useMarkets();
    const portfolio = usePortfolio();
    const [tab, setTab] = useState<HomeTab>('Explore');

    const onRefresh = () => {
        void markets.refetch();
        void portfolio.refetch();
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
                {tab === 'Explore' ? (
                    <ExploreTab />
                ) : tab === 'Holdings' ? (
                    <HoldingsTab />
                ) : (
                    <OrdersTab />
                )}
            </CollapsingScreen>
        </Screen>
    );
}

const styles = StyleSheet.create({
    tabBody: { padding: Spacing.lg, gap: Spacing['2xl'] },
    portfolio: { gap: Spacing.sm, padding: Spacing.xl },
    valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
    divider: { height: StyleSheet.hairlineWidth, marginVertical: Spacing.sm },
    split: { flexDirection: 'row', alignItems: 'center' },
    splitCell: { flex: 1, gap: 2 },
    splitRule: {
        width: StyleSheet.hairlineWidth,
        alignSelf: 'stretch',
        marginHorizontal: Spacing.lg,
    },
    section: { gap: Spacing.md },
    bleed: { marginHorizontal: -Spacing.lg },
    moverRow: { gap: Spacing.md, paddingHorizontal: Spacing.lg, flexDirection: 'row' },
    mover: {
        width: 132,
        padding: Spacing.md,
        gap: 6,
        borderRadius: Radius.xl,
        borderWidth: StyleSheet.hairlineWidth,
    },
    holding: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    flex: { flex: 1 },
    end: { alignItems: 'flex-end', gap: 2 },
});
