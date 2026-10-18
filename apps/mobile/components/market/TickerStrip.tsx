import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { PressableScale } from '@/components/ui/PressableScale';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useMarkets, type Market } from '@/hooks/queries/useMarkets';
import { Spacing, useTheme } from '@/theme';
import { ChangePill } from './ChangePill';
import { LivePrice } from './LivePrice';

const LIMIT = 8;

function Ticker({ market }: { market: Market }) {
    return (
        <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`${market.base} ${market.quote}`}
            scaleTo={0.96}
            onPress={() => router.push({ pathname: '/market/[id]', params: { id: market.id } })}
            style={styles.ticker}
        >
            <Text variant="smallMedium">{market.base}</Text>
            <LivePrice value={market.price} variant="small" />
            <ChangePill value={market.change24h} solid />
        </PressableScale>
    );
}

export function TickerStrip() {
    const { colors } = useTheme();
    const markets = useMarkets();

    const tickers = useMemo(
        () =>
            [...(markets.data ?? [])]
                .sort((a, b) => (b.volume24h ?? -1) - (a.volume24h ?? -1))
                .slice(0, LIMIT),
        [markets.data],
    );

    return (
        <View style={[styles.wrap, { borderColor: colors.border }]}>
            {markets.isPending ? (
                <View style={styles.row}>
                    {[0, 1].map((i) => (
                        <Skeleton key={i} width={150} height={22} />
                    ))}
                </View>
            ) : (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.row}
                >
                    {tickers.map((m) => (
                        <Ticker key={m.id} market={m} />
                    ))}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: Spacing.md },
    row: { flexDirection: 'row', gap: Spacing.xl, paddingHorizontal: Spacing.lg },
    ticker: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
