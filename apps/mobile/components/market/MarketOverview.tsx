import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { RangeBar } from '@/components/ui/RangeBar';
import { Text } from '@/components/ui/Text';
import type { Market } from '@/hooks/queries/useMarkets';
import { bestPrice } from '@/lib/book';
import { formatCompact, formatPrice } from '@/lib/format';
import { useMarketBook } from '@/store/orderbook';
import { Spacing, useTheme } from '@/theme';

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.stat}>
            <Text variant="small" tone="muted">
                {label}
            </Text>
            <Text variant="bodyMedium" numeric>
                {value}
            </Text>
        </View>
    );
}

const show = (n: number | null, f: (v: number) => string) => (n === null ? '—' : f(n));

export function MarketOverview({
    market,
    price,
}: {
    market: Market | undefined;
    price: number | null;
}) {
    const { colors } = useTheme();
    const asks = useMarketBook((s) => s.asks);
    const bids = useMarketBook((s) => s.bids);

    const { bestAsk, bestBid } = useMemo(
        () => ({ bestAsk: bestPrice(asks, false), bestBid: bestPrice(bids, true) }),
        [asks, bids],
    );
    const spread = bestAsk !== null && bestBid !== null ? bestAsk - bestBid : null;
    const high = market?.high24h ?? null;
    const low = market?.low24h ?? null;

    return (
        <View style={styles.body}>
            <Text variant="title">Performance</Text>
            <RangeBar
                lowLabel="24h low"
                highLabel="24h high"
                low={low === null || price === null ? low : Math.min(low, price)}
                high={high === null || price === null ? high : Math.max(high, price)}
                value={price}
                format={formatPrice}
            />
            <View style={styles.grid}>
                <Stat label="24h open" value={show(market?.openPrice ?? null, formatPrice)} />
                <Stat
                    label="24h volume"
                    value={show(
                        market?.volume24h ?? null,
                        (v) => `${formatCompact(v)} ${market?.quote ?? ''}`,
                    )}
                />
                <Stat label="Best bid" value={show(bestBid, formatPrice)} />
                <Stat label="Best ask" value={show(bestAsk, formatPrice)} />
                <Stat label="Spread" value={show(spread, formatPrice)} />
                <Stat label="Quote asset" value={market?.quote ?? '—'} />
            </View>
            <View style={[styles.rule, { backgroundColor: colors.border }]} />
            <Text variant="small" tone="muted">
                Prices and the book update live from the matching engine. 24h figures cover trades
                since this time yesterday.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    body: { padding: Spacing.lg, gap: Spacing.xl },
    grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: Spacing.xl },
    stat: { width: '50%', gap: 2 },
    rule: { height: StyleSheet.hairlineWidth },
});
