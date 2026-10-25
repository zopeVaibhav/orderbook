import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Maximize2 } from 'lucide-react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useCandleStream } from '@/hooks/useCandleStream';
import { DEFAULT_INTERVAL, INTERVALS } from '@/lib/chart/intervals';
import { useCandles } from '@/store/candles';
import { usePreferences } from '@/store/preferences';
import { Spacing, useTheme } from '@/theme';
import { ChartToolbar } from './ChartToolbar';
import { SkiaChart } from './SkiaChart';

const HEIGHT = 210;
const SLOT = 7;

export function MarketChart({
    marketId,
    reference,
}: {
    marketId: string | undefined;
    reference: number | null;
}) {
    const { colors } = useTheme();
    const mode = usePreferences((s) => s.chartMode);
    const setMode = usePreferences((s) => s.setChartMode);
    const intervalKey = usePreferences((s) => s.chartInterval);
    const setInterval = usePreferences((s) => s.setChartInterval);
    const interval = INTERVALS.find((i) => i.key === intervalKey) ?? DEFAULT_INTERVAL;
    const stream = useCandleStream(marketId, interval);
    const candles = useCandles((s) => s.candles);
    const [width, setWidth] = useState(0);

    return (
        <View style={styles.wrap}>
            <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height: HEIGHT }}>
                {width === 0 || (stream.isPending && candles.length === 0) ? (
                    <Skeleton height={HEIGHT} />
                ) : candles.length === 0 ? (
                    <View style={styles.empty}>
                        <Text tone="muted">No trades in this window yet</Text>
                    </View>
                ) : (
                    <SkiaChart
                        key={`${interval.key}:${mode}`}
                        candles={candles}
                        width={width}
                        height={HEIGHT}
                        mode={mode}
                        intervalMs={interval.ms}
                        reference={reference}
                        initialSlot={SLOT}
                    />
                )}
                {marketId ? (
                    <PressableScale
                        accessibilityRole="button"
                        accessibilityLabel="Open full screen chart"
                        feedback="fade"
                        hitSlop={8}
                        onPress={() =>
                            router.push({ pathname: '/chart/[id]', params: { id: marketId } })
                        }
                        style={[
                            styles.expand,
                            { backgroundColor: colors.background, borderColor: colors.border },
                        ]}
                    >
                        <Maximize2 size={15} color={colors.foreground} />
                    </PressableScale>
                ) : null}
            </View>
            <ChartToolbar
                interval={interval.key}
                onInterval={setInterval}
                mode={mode}
                onMode={setMode}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { gap: Spacing.md },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    expand: {
        position: 'absolute',
        right: 6,
        bottom: 6,
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
