import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { formatPrice, formatSize } from '@/lib/format';
import { useMarketBook } from '@/store/orderbook';
import { Spacing, useTheme } from '@/theme';
import { LivePrice } from './LivePrice';

const DEPTH = 12;
const ROW_HEIGHT = 24;

interface Level {
    key: string;
    price: number;
    quantity: number;
}

function toLevels(side: Map<string, string>, descending: boolean): Level[] {
    const levels: Level[] = [];
    for (const [price, quantity] of side) {
        levels.push({ key: price, price: parseFloat(price), quantity: parseFloat(quantity) });
    }
    levels.sort((a, b) => (descending ? b.price - a.price : a.price - b.price));
    return levels.slice(0, DEPTH);
}

const LevelRow = memo(function LevelRow({
    level,
    max,
    bid,
}: {
    level: Level;
    max: number;
    bid: boolean;
}) {
    const { colors } = useTheme();
    const width = `${max > 0 ? Math.max(2, (level.quantity / max) * 100) : 0}%` as const;
    return (
        <View style={styles.row}>
            <View
                style={[
                    styles.depth,
                    { width, backgroundColor: bid ? colors.profitSoft : colors.lossSoft },
                ]}
            />
            <Text variant="small" tone={bid ? 'profit' : 'loss'} numeric style={styles.cell}>
                {formatPrice(level.price)}
            </Text>
            <Text variant="small" numeric style={[styles.cell, styles.right]}>
                {formatSize(level.quantity)}
            </Text>
            <Text variant="small" tone="muted" numeric style={[styles.cell, styles.right]}>
                {formatPrice(level.price * level.quantity)}
            </Text>
        </View>
    );
});

export function OrderBook() {
    const { colors } = useTheme();
    const asksMap = useMarketBook((s) => s.asks);
    const bidsMap = useMarketBook((s) => s.bids);
    const ready = useMarketBook((s) => s.ready);
    const lastTrade = useMarketBook((s) => s.trades[0]);

    const { asks, bids, max, spread } = useMemo(() => {
        const a = toLevels(asksMap, false);
        const b = toLevels(bidsMap, true);
        const bestAsk = a[0]?.price;
        const bestBid = b[0]?.price;
        return {
            asks: [...a].reverse(),
            bids: b,
            max: Math.max(0, ...a.map((l) => l.quantity), ...b.map((l) => l.quantity)),
            spread: bestAsk !== undefined && bestBid !== undefined ? bestAsk - bestBid : null,
        };
    }, [asksMap, bidsMap]);

    if (!ready) {
        return (
            <View style={styles.loading}>
                {Array.from({ length: 8 }, (_, i) => (
                    <Skeleton key={i} height={18} />
                ))}
            </View>
        );
    }

    const last = lastTrade ? parseFloat(lastTrade.price) : null;
    const lastUp = lastTrade?.taker_side !== 'ASK';

    return (
        <View>
            <View style={styles.row}>
                <Text variant="caption" tone="muted" style={styles.cell}>
                    PRICE
                </Text>
                <Text variant="caption" tone="muted" style={[styles.cell, styles.right]}>
                    SIZE
                </Text>
                <Text variant="caption" tone="muted" style={[styles.cell, styles.right]}>
                    TOTAL
                </Text>
            </View>
            {asks.length === 0 ? (
                <Text variant="small" tone="muted" style={styles.empty}>
                    No asks
                </Text>
            ) : (
                asks.map((l) => <LevelRow key={l.key} level={l} max={max} bid={false} />)
            )}
            <View style={[styles.mid, { borderColor: colors.border }]}>
                <LivePrice value={last} variant="heading" />
                {last !== null ? (
                    <Text variant="caption" tone={lastUp ? 'profit' : 'loss'}>
                        {lastUp ? '▲' : '▼'}
                    </Text>
                ) : null}
                <Text variant="small" tone="muted" numeric style={styles.spread}>
                    Spread {spread === null ? '—' : formatPrice(spread)}
                </Text>
            </View>
            {bids.length === 0 ? (
                <Text variant="small" tone="muted" style={styles.empty}>
                    No bids
                </Text>
            ) : (
                bids.map((l) => <LevelRow key={l.key} level={l} max={max} bid />)
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', height: ROW_HEIGHT },
    depth: { position: 'absolute', right: 0, top: 2, bottom: 2, borderRadius: 3 },
    cell: { flex: 1 },
    right: { textAlign: 'right' },
    mid: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
        marginVertical: Spacing.xs,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    spread: { marginLeft: 'auto' },
    empty: { paddingVertical: Spacing.sm, textAlign: 'center' },
    loading: { gap: Spacing.sm },
});
