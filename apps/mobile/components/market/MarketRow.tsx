import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import type { Market } from '@/hooks/queries/useMarkets';
import { formatCompact, formatPrice } from '@/lib/format';
import { Spacing } from '@/theme';
import { ChangePill } from './ChangePill';
import { CoinBadge } from './CoinBadge';

export function MarketRow({ market }: { market: Market }) {
    return (
        <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`${market.base} ${market.quote}`}
            scaleTo={0.985}
            onPress={() => router.push({ pathname: '/market/[id]', params: { id: market.id } })}
            style={styles.row}
        >
            <CoinBadge symbol={market.base} />
            <View style={styles.name}>
                <Text variant="bodyMedium">
                    {market.base}
                    <Text variant="small" tone="muted">
                        {' '}
                        / {market.quote}
                    </Text>
                </Text>
                <Text variant="small" tone="muted" numberOfLines={1}>
                    {market.volume24h === null
                        ? market.name
                        : `Vol ${formatCompact(market.volume24h)}`}
                </Text>
            </View>
            <View style={styles.price}>
                <Text variant="bodyMedium" numeric>
                    {market.price === null ? '—' : formatPrice(market.price)}
                </Text>
                <ChangePill value={market.change24h} />
            </View>
        </PressableScale>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.md,
    },
    name: { flex: 1, gap: 2 },
    price: { alignItems: 'flex-end', gap: 2 },
});
