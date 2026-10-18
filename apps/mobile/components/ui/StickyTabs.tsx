import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, type LayoutRectangle } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { Spacing, useTheme } from '@/theme';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

const SLIDE = { duration: 240, easing: Easing.out(Easing.cubic) };

interface StickyTabsProps<T extends string> {
    tabs: readonly T[];
    value: T;
    onChange: (tab: T) => void;
}

export function StickyTabs<T extends string>({ tabs, value, onChange }: StickyTabsProps<T>) {
    const { colors } = useTheme();
    const [layouts, setLayouts] = useState<Partial<Record<T, LayoutRectangle>>>({});
    const x = useSharedValue(0);
    const width = useSharedValue(0);
    const active = layouts[value];

    useEffect(() => {
        if (!active) return;
        x.set(withTiming(active.x, SLIDE));
        width.set(withTiming(active.width, SLIDE));
    }, [active, x, width]);

    const underline = useAnimatedStyle(() => ({
        width: width.get(),
        transform: [{ translateX: x.get() }],
    }));

    return (
        <View
            style={[styles.bar, { backgroundColor: colors.background, borderColor: colors.border }]}
        >
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.row}
            >
                {tabs.map((tab) => {
                    const selected = tab === value;
                    return (
                        <PressableScale
                            key={tab}
                            accessibilityRole="tab"
                            accessibilityState={{ selected }}
                            scaleTo={0.96}
                            onPress={() => onChange(tab)}
                            onLayout={(e) => {
                                const layout = e.nativeEvent.layout;
                                setLayouts((prev) => ({ ...prev, [tab]: layout }));
                            }}
                            style={styles.tab}
                        >
                            <Text variant="heading" tone={selected ? 'default' : 'muted'}>
                                {tab}
                            </Text>
                        </PressableScale>
                    );
                })}
                <Animated.View
                    style={[styles.underline, { backgroundColor: colors.foreground }, underline]}
                />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    bar: { borderBottomWidth: StyleSheet.hairlineWidth },
    row: { paddingHorizontal: Spacing.lg, gap: Spacing['2xl'] },
    tab: { paddingTop: Spacing.sm + 2, paddingBottom: Spacing.md },
    underline: { position: 'absolute', left: 0, bottom: 0, height: 3, borderRadius: 2 },
});
