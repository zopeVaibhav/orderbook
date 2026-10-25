import { ScrollView, StyleSheet, View } from 'react-native';
import { ChartCandlestick, ChartLine, Maximize2 } from 'lucide-react-native';
import type { CandleInterval } from '@repo/types';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { INTERVALS } from '@/lib/chart/intervals';
import { Radius, Spacing, useTheme } from '@/theme';
import type { ChartMode } from './CandleChart';

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
                {INTERVALS.map((option) => {
                    const active = option.key === interval;
                    return (
                        <PressableScale
                            key={option.key}
                            accessibilityRole="button"
                            accessibilityState={{ selected: active }}
                            accessibilityLabel={`${option.label} interval`}
                            scaleTo={0.92}
                            onPress={() => onInterval(option.key)}
                            style={[
                                styles.chip,
                                active && {
                                    borderColor: colors.foreground,
                                    backgroundColor: colors.secondary,
                                },
                            ]}
                        >
                            <Text variant="smallMedium" tone={active ? 'default' : 'muted'}>
                                {option.label}
                            </Text>
                        </PressableScale>
                    );
                })}
            </ScrollView>
            <PressableScale
                accessibilityRole="button"
                accessibilityLabel={mode === 'candles' ? 'Show line chart' : 'Show candles'}
                hitSlop={8}
                scaleTo={0.88}
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
                    scaleTo={0.88}
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
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: Radius.full,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'transparent',
    },
    icon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
});
