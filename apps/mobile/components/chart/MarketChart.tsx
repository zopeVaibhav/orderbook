import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useCandleStream } from '@/hooks/useCandleStream';
import { DEFAULT_INTERVAL, INTERVALS } from '@/lib/chart/intervals';
import { useCandles } from '@/store/candles';
import { usePreferences } from '@/store/preferences';
import { Spacing } from '@/theme';
import { CandleChart } from './CandleChart';
import { ChartToolbar } from './ChartToolbar';

const HEIGHT = 200;

export function MarketChart({
    marketId,
    reference,
}: {
    marketId: string | undefined;
    reference: number | null;
}) {
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
                    <CandleChart
                        candles={candles}
                        width={width}
                        height={HEIGHT}
                        mode={mode}
                        intervalMs={interval.ms}
                        reference={reference}
                    />
                )}
            </View>
            <ChartToolbar
                interval={interval.key}
                onInterval={setInterval}
                mode={mode}
                onMode={setMode}
                onExpand={
                    marketId
                        ? () => router.push({ pathname: '/chart/[id]', params: { id: marketId } })
                        : undefined
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { gap: Spacing.sm },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
