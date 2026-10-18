import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import type { Market } from '@/hooks/queries/useMarkets';
import { formatChange, formatPrice } from '@/lib/format';
import { Radius, Spacing, useTheme } from '@/theme';
import { CoinBadge } from './CoinBadge';
import { LivePrice } from './LivePrice';

function changeLine(market: Market): string | null {
    if (market.change24h === null) return null;
    const pct = formatChange(market.change24h);
    if (market.price === null || market.openPrice === null) return pct;
    const abs = market.price - market.openPrice;
    return `${abs >= 0 ? '+' : '-'}${formatPrice(Math.abs(abs))} (${pct.replace(/^[+-]/, '')})`;
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
            <CoinBadge symbol={market.base} size={36} />
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

export function SeeAllTile({ label, onPress }: { label: string; onPress: () => void }) {
    const { colors } = useTheme();
    return (
        <PressableScale
            accessibilityRole="button"
            accessibilityLabel={label}
            scaleTo={0.97}
            onPress={onPress}
            style={[
                styles.tile,
                styles.seeAll,
                { backgroundColor: colors.card, borderColor: colors.border },
            ]}
        >
            <Text variant="bodyMedium">{label}</Text>
            <ChevronRight size={18} color={colors.foreground} />
        </PressableScale>
    );
}

const styles = StyleSheet.create({
    tile: {
        flexBasis: '47%',
        flexGrow: 1,
        minHeight: 168,
        padding: Spacing.lg,
        gap: Spacing.sm,
        borderRadius: Radius['2xl'],
        borderWidth: StyleSheet.hairlineWidth,
    },
    spacer: { flex: 1 },
    seeAll: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
});
