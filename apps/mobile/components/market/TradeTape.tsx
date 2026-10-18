import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import type { PublicTrade } from '@repo/types/socket';
import { EmptyState } from '@/components/ui/EmptyState';
import { Text } from '@/components/ui/Text';
import { formatClock, formatPrice, formatSize } from '@/lib/format';
import { useMarketBook } from '@/store/orderbook';

const VISIBLE = 40;

const TradeRow = memo(function TradeRow({ trade }: { trade: PublicTrade }) {
    const buy = trade.taker_side === 'BID';
    return (
        <Animated.View entering={FadeInUp.duration(220)} style={styles.row}>
            <Text variant="small" tone={buy ? 'profit' : 'loss'} numeric style={styles.cell}>
                {formatPrice(parseFloat(trade.price))}
            </Text>
            <Text variant="small" numeric style={[styles.cell, styles.right]}>
                {formatSize(parseFloat(trade.quantity))}
            </Text>
            <Text variant="small" tone="muted" numeric style={[styles.cell, styles.right]}>
                {formatClock(trade.ts)}
            </Text>
        </Animated.View>
    );
});

export function TradeTape() {
    const trades = useMarketBook((s) => s.trades);

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
                    TIME
                </Text>
            </View>
            {trades.length === 0 ? (
                <EmptyState title="No trades yet" message="New trades appear here as they print." />
            ) : (
                trades.slice(0, VISIBLE).map((t) => <TradeRow key={t.trade_id} trade={t} />)
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', height: 24 },
    cell: { flex: 1 },
    right: { textAlign: 'right' },
});
