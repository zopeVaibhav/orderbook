import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { Radius, useTheme } from '@/theme';

const ASKS = [0.34, 0.52, 0.41, 0.68, 0.86];
const BIDS = [0.92, 0.71, 0.58, 0.44, 0.3];
const ROW_HEIGHT = 14;

function Bar({ width, color, index }: { width: number; color: string; index: number }) {
    const grow = useSharedValue(0);

    useEffect(() => {
        grow.set(
            withDelay(
                index * 70,
                withSequence(
                    withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }),
                    withRepeat(
                        withTiming(0.82, {
                            duration: 1600 + index * 180,
                            easing: Easing.inOut(Easing.sin),
                        }),
                        -1,
                        true,
                    ),
                ),
            ),
        );
    }, [grow, index]);

    const animated = useAnimatedStyle(() => ({ width: `${width * grow.get() * 100}%` }));

    return (
        <View style={styles.row}>
            <Animated.View style={[styles.bar, { backgroundColor: color }, animated]} />
        </View>
    );
}

export function DepthArt() {
    const { colors } = useTheme();
    return (
        <View
            style={styles.wrap}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            {ASKS.map((w, i) => (
                <Bar key={`a${i}`} width={w} color={colors.lossSoft} index={i} />
            ))}
            <View style={[styles.mid, { backgroundColor: colors.border }]} />
            {BIDS.map((w, i) => (
                <Bar key={`b${i}`} width={w} color={colors.profitSoft} index={i + ASKS.length} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { width: '100%', gap: 6 },
    row: { height: ROW_HEIGHT, width: '100%', alignItems: 'flex-end' },
    bar: { height: ROW_HEIGHT, borderRadius: Radius.sm },
    mid: { height: StyleSheet.hairlineWidth, marginVertical: 6 },
});
