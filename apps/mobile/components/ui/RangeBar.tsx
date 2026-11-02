import { StyleSheet, View } from 'react-native';
import { Spacing, useTheme } from '@/theme';
import { Text } from './Text';

interface RangeBarProps {
    lowLabel: string;
    highLabel: string;
    low: number | null;
    high: number | null;
    value: number | null;
    format: (n: number) => string;
}

export function RangeBar({ lowLabel, highLabel, low, high, value, format }: RangeBarProps) {
    const { colors } = useTheme();
    const known = low !== null && high !== null && value !== null;
    const pct = known && high > low ? Math.min(1, Math.max(0, (value - low) / (high - low))) : 0.5;

    return (
        <View style={styles.wrap}>
            <View style={styles.labels}>
                <View>
                    <Text variant="small" tone="muted">
                        {lowLabel}
                    </Text>
                    <Text variant="bodyMedium" numeric>
                        {low === null ? '—' : format(low)}
                    </Text>
                </View>
                <View style={styles.right}>
                    <Text variant="small" tone="muted">
                        {highLabel}
                    </Text>
                    <Text variant="bodyMedium" numeric>
                        {high === null ? '—' : format(high)}
                    </Text>
                </View>
            </View>
            <View
                style={[styles.track, { backgroundColor: known ? colors.profit : colors.muted }]}
            />
            {known ? (
                <View style={[styles.markerRow, { left: `${pct * 100}%` }]}>
                    <View style={[styles.marker, { borderBottomColor: colors.foreground }]} />
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { gap: Spacing.sm, paddingBottom: Spacing.md },
    labels: { flexDirection: 'row', justifyContent: 'space-between' },
    right: { alignItems: 'flex-end' },
    track: { height: 4, borderRadius: 2 },
    markerRow: { position: 'absolute', bottom: 0, marginLeft: -6 },
    marker: {
        width: 0,
        height: 0,
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderBottomWidth: 9,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
    },
});
