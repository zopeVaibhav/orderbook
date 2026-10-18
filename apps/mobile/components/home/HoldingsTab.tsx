import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChangePill } from '@/components/market/ChangePill';
import { CoinBadge } from '@/components/market/CoinBadge';
import { LivePrice } from '@/components/market/LivePrice';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PressableScale } from '@/components/ui/PressableScale';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { usePortfolio, type Holding } from '@/hooks/queries/useAccount';
import { formatSize, formatUsd } from '@/lib/format';
import { Spacing, useTheme } from '@/theme';

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <View style={styles.summaryRow}>
            <Text tone="muted">{label}</Text>
            {children}
        </View>
    );
}

function SummaryCard() {
    const { colors } = useTheme();
    const { data, isPending } = usePortfolio();
    const count = data?.holdings.length ?? 0;

    return (
        <Card style={styles.summary}>
            <Text variant="caption" tone="muted">
                {`HOLDINGS (${count})`}
            </Text>
            {isPending || !data ? (
                <Skeleton width="60%" height={34} />
            ) : (
                <Text variant="display" numeric>
                    {formatUsd(data.total)}
                    <Text variant="bodyMedium" tone="muted">
                        {' '}
                        USDC
                    </Text>
                </Text>
            )}
            <View style={[styles.rule, { backgroundColor: colors.border }]} />
            <SummaryRow label="24h change">
                <ChangePill value={data?.change24h ?? null} />
            </SummaryRow>
            <SummaryRow label="Available cash">
                <Text variant="bodyMedium" numeric>
                    {data ? formatUsd(data.cash) : '—'}
                </Text>
            </SummaryRow>
            <SummaryRow label="In open orders">
                <Text variant="bodyMedium" numeric>
                    {data ? formatUsd(data.inOrders) : '—'}
                </Text>
            </SummaryRow>
        </Card>
    );
}

function HoldingRow({ holding }: { holding: Holding }) {
    const { colors } = useTheme();
    return (
        <PressableScale
            accessibilityRole="button"
            disabled={!holding.marketId}
            scaleTo={0.985}
            onPress={() =>
                holding.marketId &&
                router.push({ pathname: '/market/[id]', params: { id: holding.marketId } })
            }
            style={[styles.holding, { borderColor: colors.border }]}
        >
            <CoinBadge symbol={holding.asset} size={36} />
            <View style={styles.flex}>
                <Text variant="bodyMedium">{holding.asset}</Text>
                <Text variant="small" tone="muted" numeric>
                    {formatSize(holding.quantity)} units
                </Text>
            </View>
            <View style={styles.end}>
                <Text variant="bodyMedium" numeric>
                    {holding.value === null ? '—' : formatUsd(holding.value)}
                </Text>
                <View style={styles.inline}>
                    <LivePrice value={holding.price} variant="small" />
                    <ChangePill value={holding.change24h} />
                </View>
            </View>
        </PressableScale>
    );
}

export function HoldingsTab() {
    const { data } = usePortfolio();

    return (
        <View style={styles.body}>
            <Animated.View entering={FadeInDown.duration(320)}>
                <SummaryCard />
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(80).duration(320)}>
                {data && data.holdings.length > 0 ? (
                    data.holdings.map((h) => <HoldingRow key={h.asset} holding={h} />)
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

const styles = StyleSheet.create({
    body: { padding: Spacing.lg, gap: Spacing.xl },
    summary: { gap: Spacing.md, padding: Spacing.xl },
    rule: { height: StyleSheet.hairlineWidth, marginVertical: Spacing.xs },
    summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    holding: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    flex: { flex: 1, gap: 2 },
    end: { alignItems: 'flex-end', gap: 2 },
    inline: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
