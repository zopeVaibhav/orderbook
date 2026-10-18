import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import type { Market } from '@/hooks/queries/useMarkets';
import { formatChange, formatDelta } from '@/lib/format';
import { Radius, Spacing, useTheme } from '@/theme';
import { CoinBadge } from './CoinBadge';
import { LivePrice } from './LivePrice';

function changeLine(market: Market): string | null {
    if (market.change24h === null) return null;
    const pct = formatChange(market.change24h);
    if (market.price === null || market.openPrice === null) return pct;
    return `${formatDelta(market.price - market.openPrice, market.price)} (${pct.replace(/^[+-]/, '')})`;
}

export function MarketTile({ market }: { market: Market }) {
    const { colors } = useTheme();
    const line = changeLine(market);
    const up = (market.change24h ?? 0) >= 0;

    return (
        <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`${market.base} ${market.quote}`}
            scaleTo={0.97}
            onPress={() => router.push({ pathname: '/market/[id]', params: { id: market.id } })}
            style={[styles.tile, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
            <CoinBadge symbol={market.base} size={30} />
            <Text variant="bodyMedium" numberOfLines={1}>
                {market.name}
            </Text>
            <View style={styles.spacer} />
            <LivePrice value={market.price} variant="bodyMedium" />
            <Text variant="small" tone={line ? (up ? 'profit' : 'loss') : 'muted'} numeric>
                {line ?? 'No trades today'}
            </Text>
        </PressableScale>
    );
}

const styles = StyleSheet.create({
    tile: {
        flexBasis: '47%',
        flexGrow: 1,
        minHeight: 128,
        padding: Spacing.md,
        gap: 6,
        borderRadius: Radius.xl,
        borderWidth: StyleSheet.hairlineWidth,
    },
    spacer: { flex: 1 },
});
