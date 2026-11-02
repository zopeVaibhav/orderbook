import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedStyle,
    type SharedValue,
} from 'react-native-reanimated';
import { ArrowLeft } from 'lucide-react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { Spacing, useTheme } from '@/theme';
import { ChangePill } from './ChangePill';
import { LiveBadge } from './LiveBadge';
import { LivePrice } from './LivePrice';

interface MarketTopBarProps {
    title: string;
    price: number | null;
    change: number | null;
    scrollY: SharedValue<number>;
    revealAt: number;
}

export function MarketTopBar({ title, price, change, scrollY, revealAt }: MarketTopBarProps) {
    const { colors } = useTheme();

    const compact = useAnimatedStyle(() => {
        const y = scrollY.get();
        return {
            opacity: interpolate(y, [revealAt - 40, revealAt], [0, 1], Extrapolation.CLAMP),
            transform: [
                {
                    translateY: interpolate(
                        y,
                        [revealAt - 40, revealAt],
                        [8, 0],
                        Extrapolation.CLAMP,
                    ),
                },
            ],
        };
    });

    return (
        <View style={[styles.bar, { backgroundColor: colors.background }]}>
            <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={12}
                scaleTo={0.9}
                onPress={() => router.back()}
            >
                <ArrowLeft size={20} color={colors.foreground} />
            </PressableScale>
            <Animated.View style={[styles.compact, compact]} pointerEvents="none">
                <Text variant="bodyMedium" numberOfLines={1}>
                    {title}
                </Text>
                <View style={styles.inline}>
                    <LivePrice value={price} variant="small" />
                    <ChangePill value={change} />
                </View>
            </Animated.View>
            <LiveBadge />
        </View>
    );
}

const styles = StyleSheet.create({
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.lg,
        paddingHorizontal: Spacing.lg,
        height: 52,
    },
    compact: { flex: 1 },
    inline: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
