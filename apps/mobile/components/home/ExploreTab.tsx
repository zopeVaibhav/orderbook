import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MarketRow } from '@/components/market/MarketRow';
import { MarketTile, SeeAllTile } from '@/components/market/MarketTile';
import { RecentStrip } from '@/components/market/RecentStrip';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useMarkets } from '@/hooks/queries/useMarkets';
import { Radius, Spacing } from '@/theme';

const MOVER_TILES = 3;
const MOST_TRADED = 5;

export function ExploreTab() {
    const markets = useMarkets();

    const movers = useMemo(
        () =>
            (markets.data ?? [])
                .filter((m) => m.change24h !== null)
                .sort((a, b) => Math.abs(b.change24h ?? 0) - Math.abs(a.change24h ?? 0))
                .slice(0, MOVER_TILES),
        [markets.data],
    );

    const mostTraded = useMemo(
        () =>
            [...(markets.data ?? [])]
                .sort((a, b) => (b.volume24h ?? -1) - (a.volume24h ?? -1))
                .slice(0, MOST_TRADED),
        [markets.data],
    );

    if (markets.isError) {
        return (
            <View style={styles.body}>
                <EmptyState
                    title="Markets unavailable"
                    message="Could not reach the server."
                    actionLabel="Retry"
                    onAction={() => void markets.refetch()}
                />
            </View>
        );
    }

    return (
        <View style={styles.body}>
            <RecentStrip />

            <Animated.View entering={FadeInDown.duration(320)} style={styles.section}>
                <SectionHeader title="Top movers" />
                <View style={styles.grid}>
                    {markets.isPending
                        ? [0, 1, 2, 3].map((i) => (
                              <View key={i} style={styles.cell}>
                                  <Skeleton height={168} radius={Radius['2xl']} />
                              </View>
                          ))
                        : movers.map((m) => <MarketTile key={m.id} market={m} />)}
                    {!markets.isPending ? (
                        <SeeAllTile label="See all" onPress={() => router.navigate('/markets')} />
                    ) : null}
                </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(80).duration(320)} style={styles.section}>
                <SectionHeader
                    title="Most traded"
                    actionLabel="View all"
                    onAction={() => router.navigate('/markets')}
                />
                {mostTraded.map((m) => (
                    <MarketRow key={m.id} market={m} />
                ))}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    body: { padding: Spacing.lg, gap: Spacing['3xl'] },
    section: { gap: Spacing.md },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
    cell: { flexBasis: '47%', flexGrow: 1 },
});
