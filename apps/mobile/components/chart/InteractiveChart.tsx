import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector, useExclusiveGestures, usePanGesture } from 'react-native-gesture-handler';
import { Text } from '@/components/ui/Text';
import { clampOffset, formatAxisTime, indexAt, visibleCount } from '@/lib/chart/geometry';
import { formatPrice, formatSize } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import type { Candle } from '@/store/candles';
import { Radius, Spacing, useTheme } from '@/theme';
import { CandleChart, CHART_AXIS_WIDTH, type ChartMode } from './CandleChart';

interface InteractiveChartProps {
    candles: Candle[];
    width: number;
    height: number;
    mode: ChartMode;
    intervalMs: number;
    slot?: number;
    axes?: boolean;
    reference?: number | null;
}

const LONG_PRESS_MS = 220;

function Readout({ candle, intervalMs }: { candle: Candle; intervalMs: number }) {
    const { colors } = useTheme();
    const up = candle.close >= candle.open;
    const cells: [string, string][] = [
        ['O', formatPrice(candle.open)],
        ['H', formatPrice(candle.high)],
        ['L', formatPrice(candle.low)],
        ['C', formatPrice(candle.close)],
        ['V', formatSize(candle.volume)],
    ];
    return (
        <View
            pointerEvents="none"
            style={[styles.readout, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
            <Text variant="caption" tone="muted">
                {formatAxisTime(candle.time, intervalMs)}
            </Text>
            {cells.map(([label, value]) => (
                <Text key={label} variant="caption" numeric>
                    <Text variant="caption" tone="muted">
                        {label}{' '}
                    </Text>
                    <Text
                        variant="caption"
                        tone={label === 'C' ? (up ? 'profit' : 'loss') : 'default'}
                    >
                        {value}
                    </Text>
                </Text>
            ))}
        </View>
    );
}

export function InteractiveChart({
    candles,
    width,
    height,
    mode,
    intervalMs,
    slot = 8,
    axes = false,
    reference = null,
}: InteractiveChartProps) {
    const [offset, setOffset] = useState(0);
    const [crosshair, setCrosshair] = useState<number | null>(null);
    const panStart = useRef(0);
    const plotWidth = axes ? width - CHART_AXIS_WIDTH : width;
    const count = visibleCount(plotWidth, slot);
    const safeOffset = clampOffset(offset, candles.length, count);
    const visibleLength = Math.min(count, candles.length - safeOffset);
    const start = candles.length - safeOffset - visibleLength;

    const inspect = usePanGesture({
        activateAfterLongPress: LONG_PRESS_MS,
        runOnJS: true,
        onActivate: (e) => {
            haptic.tap();
            setCrosshair(indexAt(e.x, plotWidth, slot, visibleLength));
        },
        onUpdate: (e) => {
            const next = indexAt(e.x, plotWidth, slot, visibleLength);
            setCrosshair((prev) => {
                if (prev !== next) haptic.tap();
                return next;
            });
        },
        onFinalize: () => setCrosshair(null),
    });

    const scrub = usePanGesture({
        activeOffsetX: [-12, 12],
        failOffsetY: [-14, 14],
        runOnJS: true,
        onActivate: () => {
            panStart.current = safeOffset;
        },
        onUpdate: (e) => {
            const moved = Math.round(e.translationX / slot);
            setOffset(clampOffset(panStart.current + moved, candles.length, count));
        },
    });

    const gesture = useExclusiveGestures(inspect, scrub);
    const hovered = crosshair !== null ? candles[start + crosshair] : undefined;

    return (
        <GestureDetector gesture={gesture}>
            <View style={{ width, height }}>
                <CandleChart
                    candles={candles}
                    width={width}
                    height={height}
                    mode={mode}
                    intervalMs={intervalMs}
                    slot={slot}
                    endOffset={safeOffset}
                    axes={axes}
                    reference={reference}
                    crosshair={crosshair}
                />
                {hovered ? <Readout candle={hovered} intervalMs={intervalMs} /> : null}
                {safeOffset > 0 && crosshair === null ? (
                    <View pointerEvents="none" style={styles.history}>
                        <Text variant="caption" tone="muted">
                            {`${safeOffset} BACK · SWIPE LEFT FOR LIVE`}
                        </Text>
                    </View>
                ) : null}
            </View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    readout: {
        position: 'absolute',
        top: 4,
        left: 4,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: Radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        maxWidth: '92%',
    },
    history: { position: 'absolute', top: 6, right: 8 },
});
