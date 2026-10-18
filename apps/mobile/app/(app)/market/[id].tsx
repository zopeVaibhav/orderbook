import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { PublicTrade } from '@repo/types';
import { ChangePill } from '@/components/market/ChangePill';
import { CoinBadge } from '@/components/market/CoinBadge';
import { BackHeader } from '@/components/ui/BackHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useTrades } from '@/hooks/queries/useAccount';
import { useMarket } from '@/hooks/queries/useMarkets';
import { formatClock, formatCompact, formatPrice, formatSize } from '@/lib/format';
import { Spacing, useTheme } from '@/theme';

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.stat}>
            <Text variant="caption" tone="muted">
                {label}
            </Text>
            <Text variant="bodyMedium" numeric>
                {value}
            </Text>
        </View>
    );
}

function TradeRow({ trade }: { trade: PublicTrade }) {
    const buy = trade.taker_side === 'BID';
    return (
        <View style={styles.trade}>
            <Text variant="small" tone={buy ? 'profit' : 'loss'} numeric style={styles.tradeCell}>
                {formatPrice(parseFloat(trade.price))}
            </Text>
            <Text variant="small" numeric style={[styles.tradeCell, styles.right]}>
                {formatSize(parseFloat(trade.quantity))}
            </Text>
            <Text variant="small" tone="muted" numeric style={[styles.tradeCell, styles.right]}>
                {formatClock(trade.ts)}
            </Text>
        </View>
    );
}

export default function MarketScreen() {
    const { colors } = useTheme();
    const { id } = useLocalSearchParams<{ id: string }>();
    const market = useMarket(id);
    const trades = useTrades(id);
    const m = market.data;

    const header = (
        <View style={styles.headerBlock}>
            <View style={styles.identity}>
                <CoinBadge symbol={m?.base ?? '?'} size={48} />
                <View>
                    <Text variant="heading">{m ? `${m.base} / ${m.quote}` : ' '}</Text>
                    <Text variant="small" tone="muted">
                        {m?.name ?? ' '}
                    </Text>
                </View>
            </View>

            {market.isPending ? (
                <Skeleton width="55%" height={38} />
            ) : (
                <Animated.View entering={FadeIn.duration(300)} style={styles.priceRow}>
                    <Text variant="display" numeric>
                        {m?.price === null || m?.price === undefined ? '—' : formatPrice(m.price)}
                    </Text>
                    <ChangePill value={m?.change24h ?? null} solid />
                </Animated.View>
            )}

            <Card style={styles.stats}>
                <Stat label="24H OPEN" value={m?.openPrice ? formatPrice(m.openPrice) : '—'} />
                <View style={[styles.rule, { backgroundColor: colors.border }]} />
                <Stat label="24H VOLUME" value={m?.volume24h ? formatCompact(m.volume24h) : '—'} />
                <View style={[styles.rule, { backgroundColor: colors.border }]} />
                <Stat label="QUOTE" value={m?.quote ?? '—'} />
            </Card>

            <View style={styles.tradesHead}>
                <Text variant="heading">Recent trades</Text>
                <View style={styles.trade}>
                    <Text variant="caption" tone="muted" style={styles.tradeCell}>
                        PRICE
                    </Text>
                    <Text variant="caption" tone="muted" style={[styles.tradeCell, styles.right]}>
                        SIZE
                    </Text>
                    <Text variant="caption" tone="muted" style={[styles.tradeCell, styles.right]}>
                        TIME
                    </Text>
                </View>
            </View>
        </View>
    );

    return (
        <Screen>
            <BackHeader />
            <FlatList
                data={(trades.data ?? []).slice(0, 50)}
                keyExtractor={(t) => String(t.trade_id)}
                renderItem={({ item }) => <TradeRow trade={item} />}
                ListHeaderComponent={header}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={trades.isRefetching}
                        onRefresh={() => {
                            void trades.refetch();
                            void market.refetch();
                        }}
                        tintColor={colors.mutedForeground}
                    />
                }
                ListEmptyComponent={
                    trades.isPending ? (
                        <View style={styles.skeletons}>
                            {[0, 1, 2, 3].map((i) => (
                                <Skeleton key={i} height={18} />
                            ))}
                        </View>
                    ) : (
                        <EmptyState
                            title="No trades yet"
                            message="This market has not traded recently."
                        />
                    )
                }
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['3xl'] },
    headerBlock: { gap: Spacing.xl, paddingBottom: Spacing.sm },
    identity: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    stats: { flexDirection: 'row', alignItems: 'center' },
    stat: { flex: 1, gap: 4, alignItems: 'center' },
    rule: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch' },
    tradesHead: { gap: Spacing.md },
    trade: { flexDirection: 'row', paddingVertical: 6 },
    tradeCell: { flex: 1 },
    right: { textAlign: 'right' },
    skeletons: { gap: Spacing.md, paddingTop: Spacing.sm },
});
