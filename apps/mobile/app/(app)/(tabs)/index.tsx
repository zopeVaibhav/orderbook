import { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Bell, Search } from 'lucide-react-native';
import { ChangePill } from '@/components/market/ChangePill';
import { CoinBadge } from '@/components/market/CoinBadge';
import { LivePrice } from '@/components/market/LivePrice';
import { MarketRow } from '@/components/market/MarketRow';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { usePortfolio, type Holding } from '@/hooks/queries/useAccount';
import { useMarkets, type Market } from '@/hooks/queries/useMarkets';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { firstName, formatSize, formatUsd } from '@/lib/format';
import { useSession } from '@/store/session';
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

export default function HomeScreen() {
    const { colors } = useTheme();
    const user = useSession((s) => s.user);
    const unread = useUnreadCount();
    const markets = useMarkets();
    const portfolio = usePortfolio();

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

    const refreshing = markets.isRefetching;
    const onRefresh = () => {
        void markets.refetch();
        void portfolio.refetch();
    };

    return (
        <Screen>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.mutedForeground}
                    />
                }
            >
                <View style={styles.header}>
                    <PressableScale
                        accessibilityRole="button"
                        accessibilityLabel="Open profile"
                        onPress={() => router.navigate('/profile')}
                        style={styles.greeting}
                    >
                        <Avatar name={user?.name ?? ''} image={user?.image ?? null} />
                        <View>
                            <Text variant="small" tone="muted">
                                Welcome back
                            </Text>
                            <Text variant="heading">Hi, {firstName(user?.name) || 'trader'}</Text>
                        </View>
                    </PressableScale>
                    <View style={styles.actions}>
                        <IconButton
                            label="Search markets"
                            icon={<Search size={18} color={colors.foreground} />}
                            onPress={() => router.navigate('/markets')}
                        />
                        <IconButton
                            label="Activity"
                            badge={unread}
                            icon={<Bell size={18} color={colors.foreground} />}
                            onPress={() => router.navigate('/notifications')}
                        />
                    </View>
                </View>

                <Animated.View entering={FadeInDown.duration(380)}>
                    <PortfolioCard />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(80).duration(380)} style={styles.section}>
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

                <Animated.View
                    entering={FadeInDown.delay(140).duration(380)}
                    style={styles.section}
                >
                    <SectionHeader title="Your holdings" />
                    {portfolio.data && portfolio.data.holdings.length > 0 ? (
                        portfolio.data.holdings.map((h) => <HoldingRow key={h.asset} holding={h} />)
                    ) : (
                        <Card>
                            <EmptyState
                                title="No holdings yet"
                                message="Buy into a market and it will show up here."
                                actionLabel="Browse markets"
                                onAction={() => router.navigate('/markets')}
                            />
                        </Card>
                    )}
                </Animated.View>

                <Animated.View
                    entering={FadeInDown.delay(200).duration(380)}
                    style={styles.section}
                >
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
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    content: { padding: Spacing.lg, gap: Spacing['2xl'], paddingBottom: Spacing['3xl'] },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    greeting: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    actions: { flexDirection: 'row', gap: Spacing.sm },
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
