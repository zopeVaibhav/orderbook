import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { X } from 'lucide-react-native';
import { SkiaChart } from '@/components/chart/SkiaChart';
import { ChartToolbar } from '@/components/chart/ChartToolbar';
import { ChangePill } from '@/components/market/ChangePill';
import { LiveBadge } from '@/components/market/LiveBadge';
import { LivePrice } from '@/components/market/LivePrice';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useMarket } from '@/hooks/queries/useMarkets';
import { DEFAULT_INTERVAL, INTERVALS } from '@/lib/chart/intervals';
import { useCandles } from '@/store/candles';
import { usePreferences } from '@/store/preferences';
import { Spacing, useTheme } from '@/theme';

const SLOT = 10;

export default function ChartScreen() {
    const { colors } = useTheme();
    const { id } = useLocalSearchParams<{ id: string }>();
    const market = useMarket(id);
    const candles = useCandles((s) => s.candles);
    const mode = usePreferences((s) => s.chartMode);
    const setMode = usePreferences((s) => s.setChartMode);
    const intervalKey = usePreferences((s) => s.chartInterval);
    const setInterval = usePreferences((s) => s.setChartInterval);
    const interval = INTERVALS.find((i) => i.key === intervalKey) ?? DEFAULT_INTERVAL;
    const [size, setSize] = useState({ width: 0, height: 0 });
    const m = market.data;
    const last = candles[candles.length - 1];
    const price = last?.close ?? m?.price ?? null;
    const open = m?.openPrice ?? null;
    const change = price !== null && open ? ((price - open) / open) * 100 : null;

    return (
        <Screen edges={['top', 'bottom']}>
            <View style={styles.top}>
                <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel="Close chart"
                    hitSlop={12}
                    scaleTo={0.9}
                    onPress={() => router.back()}
                >
                    <X size={22} color={colors.foreground} />
                </PressableScale>
                <View style={styles.title}>
                    <Text variant="heading">{m ? `${m.base}/${m.quote}` : ' '}</Text>
                    <View style={styles.inline}>
                        <LivePrice value={price} variant="small" />
                        <ChangePill value={change} />
                    </View>
                </View>
                <LiveBadge />
            </View>

            <View style={styles.toolbar}>
                <ChartToolbar
                    interval={interval.key}
                    onInterval={setInterval}
                    mode={mode}
                    onMode={setMode}
                />
            </View>

            <View
                style={styles.plot}
                onLayout={(e) =>
                    setSize({
                        width: e.nativeEvent.layout.width,
                        height: e.nativeEvent.layout.height,
                    })
                }
            >
                {size.width > 0 && candles.length > 0 ? (
                    <SkiaChart
                        key={`${interval.key}:${mode}`}
                        candles={candles}
                        width={size.width}
                        height={size.height}
                        mode={mode}
                        intervalMs={interval.ms}
                        initialSlot={SLOT}
                        axes
                    />
                ) : (
                    <View style={styles.empty}>
                        <Text tone="muted">No trades in this window yet</Text>
                    </View>
                )}
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    top: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.lg,
        paddingHorizontal: Spacing.lg,
        height: 56,
    },
    title: { flex: 1, gap: 2 },
    inline: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    toolbar: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
    plot: { flex: 1, marginLeft: Spacing.sm },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
