import { useEffect } from 'react';
import type { DimensionValue } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import { Radius, useTheme } from '@/theme';

interface SkeletonProps {
    width?: DimensionValue;
    height?: number;
    radius?: number;
}

export function Skeleton({ width = '100%', height = 16, radius = Radius.md }: SkeletonProps) {
    const { colors } = useTheme();
    const pulse = useSharedValue(0.5);

    useEffect(() => {
        pulse.set(
            withRepeat(
                withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
                -1,
                true,
            ),
        );
    }, [pulse]);

    const animated = useAnimatedStyle(() => ({ opacity: pulse.get() }));

    return (
        <Animated.View
            style={[
                { width, height, borderRadius: radius, backgroundColor: colors.muted },
                animated,
            ]}
        />
    );
}
