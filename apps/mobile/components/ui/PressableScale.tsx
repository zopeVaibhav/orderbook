import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { haptic } from '@/lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SPRING = { damping: 18, stiffness: 320, mass: 0.6 };

export interface PressableScaleProps extends Omit<PressableProps, 'style' | 'children'> {
    style?: StyleProp<ViewStyle>;
    children?: ReactNode;
    scaleTo?: number;
    withHaptic?: boolean;
}

export function PressableScale({
    style,
    children,
    scaleTo = 0.97,
    withHaptic = true,
    onPressIn,
    onPressOut,
    onPress,
    ...rest
}: PressableScaleProps) {
    const scale = useSharedValue(1);
    const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

    return (
        <AnimatedPressable
            {...rest}
            onPressIn={(e) => {
                scale.set(withSpring(scaleTo, SPRING));
                onPressIn?.(e);
            }}
            onPressOut={(e) => {
                scale.set(withSpring(1, SPRING));
                onPressOut?.(e);
            }}
            onPress={(e) => {
                if (withHaptic) haptic.tap();
                onPress?.(e);
            }}
            style={[style, animated]}
        >
            {children}
        </AnimatedPressable>
    );
}
