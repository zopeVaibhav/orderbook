import { ScrollView, StyleSheet, View } from 'react-native';
import { ChartCandlestick, ChartLine, Maximize2 } from 'lucide-react-native';
import type { CandleInterval } from '@repo/types';
import { Chip } from '@/components/ui/Chip';
import { PressableScale } from '@/components/ui/PressableScale';
import { INTERVALS } from '@/lib/chart/intervals';
import { Spacing, useTheme } from '@/theme';
import type { ChartMode } from './SkiaChart';

interface ChartToolbarProps {
    interval: CandleInterval;
    onInterval: (interval: CandleInterval) => void;
    mode: ChartMode;
    onMode: (mode: ChartMode) => void;
    onExpand?: () => void;
}

export function ChartToolbar({ interval, onInterval, mode, onMode, onExpand }: ChartToolbarProps) {
    const { colors } = useTheme();
    const ModeIcon = mode === 'candles' ? ChartLine : ChartCandlestick;

    return (
        <View style={styles.row}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chips}
                style={styles.flex}
            >
                {INTERVALS.map((option) => (
                    <Chip
                        key={option.key}
                        label={option.label}
                        accessibilityLabel={`${option.label} interval`}
                        selected={option.key === interval}
                        quiet
                        onPress={() => onInterval(option.key)}
                    />
                ))}
            </ScrollView>
            <PressableScale
                accessibilityRole="button"
                accessibilityLabel={mode === 'candles' ? 'Show line chart' : 'Show candles'}
                hitSlop={8}
                feedback="fade"
                onPress={() => onMode(mode === 'candles' ? 'line' : 'candles')}
                style={styles.icon}
            >
                <ModeIcon size={18} color={colors.foreground} />
            </PressableScale>
            {onExpand ? (
                <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel="Open full screen chart"
                    hitSlop={8}
                    feedback="fade"
                    onPress={onExpand}
                    style={styles.icon}
                >
                    <Maximize2 size={17} color={colors.foreground} />
                </PressableScale>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    flex: { flex: 1 },
    chips: { gap: Spacing.xs, alignItems: 'center' },
    icon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
});
