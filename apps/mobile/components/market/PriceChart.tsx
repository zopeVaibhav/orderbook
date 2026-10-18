import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useMarketBook } from '@/store/orderbook';
import { Spacing, useTheme } from '@/theme';

const HEIGHT = 220;
const PAD_Y = 16;
const MIN_POINTS = 2;

interface ChartProps {
    reference: number | null;
}

export function PriceChart({ reference }: ChartProps) {
    const { colors } = useTheme();
    const trades = useMarketBook((s) => s.trades);
    const ready = useMarketBook((s) => s.marketId !== null);
    const [width, setWidth] = useState(0);

    const chart = useMemo(() => {
        const points = [...trades].reverse().map((t) => parseFloat(t.price));
        if (points.length < MIN_POINTS || width === 0) return null;

        const values = reference === null ? points : [...points, reference];
        const min = Math.min(...values);
        const max = Math.max(...values);
        const span = max - min || 1;
        const step = width / (points.length - 1);
        const y = (v: number) => PAD_Y + (1 - (v - min) / span) * (HEIGHT - PAD_Y * 2);

        const line = points
            .map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${y(v).toFixed(1)}`)
            .join(' ');
        const area = `${line} L${width},${HEIGHT} L0,${HEIGHT} Z`;
        const first = points[0] ?? 0;
        const last = points[points.length - 1] ?? 0;

        return {
            line,
            area,
            up: last >= (reference ?? first),
            lastX: width,
            lastY: y(last),
            refY: reference === null ? null : y(reference),
            count: points.length,
        };
    }, [trades, width, reference]);

    const stroke = chart?.up === false ? colors.loss : colors.profit;

    return (
        <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={styles.wrap}>
            {!ready || (chart === null && trades.length >= MIN_POINTS) ? (
                <Skeleton height={HEIGHT} />
            ) : chart === null ? (
                <View style={[styles.empty, { height: HEIGHT }]}>
                    <Text tone="muted">Waiting for trades to draw the chart</Text>
                </View>
            ) : (
                <>
                    <Svg width={width} height={HEIGHT}>
                        <Defs>
                            <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor={stroke} stopOpacity={0.22} />
                                <Stop offset="1" stopColor={stroke} stopOpacity={0} />
                            </LinearGradient>
                        </Defs>
                        {chart.refY !== null ? (
                            <Line
                                x1={0}
                                x2={width}
                                y1={chart.refY}
                                y2={chart.refY}
                                stroke={colors.mutedForeground}
                                strokeOpacity={0.6}
                                strokeDasharray="4 5"
                                strokeWidth={1}
                            />
                        ) : null}
                        <Path d={chart.area} fill="url(#fill)" />
                        <Path
                            d={chart.line}
                            stroke={stroke}
                            strokeWidth={2}
                            fill="none"
                            strokeLinejoin="round"
                        />
                        <Circle
                            cx={chart.lastX - 3}
                            cy={chart.lastY}
                            r={7}
                            fill={stroke}
                            fillOpacity={0.25}
                        />
                        <Circle cx={chart.lastX - 3} cy={chart.lastY} r={3.5} fill={stroke} />
                    </Svg>
                    <Text variant="caption" tone="muted" style={styles.caption}>
                        LAST {chart.count} TRADES · DASHED LINE IS THE 24H OPEN
                    </Text>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { width: '100%', gap: Spacing.sm },
    empty: { alignItems: 'center', justifyContent: 'center' },
    caption: { textAlign: 'center' },
});
