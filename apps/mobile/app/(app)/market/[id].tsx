import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ChangePill } from '@/components/market/ChangePill';
import { CoinBadge } from '@/components/market/CoinBadge';
import { LiveBadge } from '@/components/market/LiveBadge';
import { LivePrice } from '@/components/market/LivePrice';
import { OrderBook } from '@/components/market/OrderBook';
import { TradeTape } from '@/components/market/TradeTape';
import { BackHeader } from '@/components/ui/BackHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useMarket } from '@/hooks/queries/useMarkets';
import { useMarketStream } from '@/hooks/useMarketStream';
import { formatCompact, formatPrice } from '@/lib/format';
import { useMarketBook } from '@/store/orderbook';
import { Radius, Spacing, useTheme } from '@/theme';

const TABS = ['Order book', 'Trades'] as const;
type Tab = (typeof TABS)[number];

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

export default function MarketScreen() {
    const { colors } = useTheme();
    const { id } = useLocalSearchParams<{ id: string }>();
    const market = useMarket(id);
    const stream = useMarketStream(id);
    const lastTrade = useMarketBook((s) => s.trades[0]);
    const [tab, setTab] = useState<Tab>('Order book');
    const m = market.data;
    const price = lastTrade ? parseFloat(lastTrade.price) : (m?.price ?? null);

    return (
        <Screen>
            <BackHeader trailing={<LiveBadge />} />
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={stream.isRefreshing}
                        onRefresh={() => {
                            void stream.refresh();
                            void market.refetch();
                        }}
                        tintColor={colors.mutedForeground}
                    />
                }
            >
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
                    <View style={styles.priceRow}>
                        <LivePrice value={price} variant="display" />
                        <ChangePill value={m?.change24h ?? null} solid />
                    </View>
                )}

                <Card style={styles.stats}>
                    <Stat label="24H OPEN" value={m?.openPrice ? formatPrice(m.openPrice) : '—'} />
                    <View style={[styles.rule, { backgroundColor: colors.border }]} />
                    <Stat
                        label="24H VOLUME"
                        value={m?.volume24h ? formatCompact(m.volume24h) : '—'}
                    />
                    <View style={[styles.rule, { backgroundColor: colors.border }]} />
                    <Stat label="QUOTE" value={m?.quote ?? '—'} />
                </Card>

                <View style={[styles.segment, { backgroundColor: colors.secondary }]}>
                    {TABS.map((t) => {
                        const active = t === tab;
                        return (
                            <PressableScale
                                key={t}
                                accessibilityRole="tab"
                                accessibilityState={{ selected: active }}
                                onPress={() => setTab(t)}
                                style={[
                                    styles.segmentItem,
                                    active && { backgroundColor: colors.background },
                                ]}
                            >
                                <Text variant="smallMedium" tone={active ? 'default' : 'muted'}>
                                    {t}
                                </Text>
                            </PressableScale>
                        );
                    })}
                </View>

                {stream.isError ? (
                    <EmptyState
                        title="Book unavailable"
                        message="Could not load this market from the server."
                        actionLabel="Retry"
                        onAction={() => void stream.refresh()}
                    />
                ) : tab === 'Order book' ? (
                    <OrderBook />
                ) : (
                    <TradeTape />
                )}
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['3xl'], gap: Spacing.xl },
    identity: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    stats: { flexDirection: 'row', alignItems: 'center' },
    stat: { flex: 1, gap: 4, alignItems: 'center' },
    rule: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch' },
    segment: { flexDirection: 'row', padding: 3, borderRadius: Radius.lg },
    segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: Radius.md },
});
