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
    feedback?: 'scale' | 'fade';
    withHaptic?: boolean;
}

export function PressableScale({
    style,
    children,
    scaleTo = 0.97,
    feedback = 'scale',
    withHaptic = true,
    onPressIn,
    onPressOut,
    onPress,
    ...rest
}: PressableScaleProps) {
    const pressed = useSharedValue(0);
    const animated = useAnimatedStyle(() =>
        feedback === 'fade'
            ? { opacity: 1 - pressed.get() * 0.45 }
            : { transform: [{ scale: 1 - pressed.get() * (1 - scaleTo) }] },
    );

    return (
        <AnimatedPressable
            {...rest}
            onPressIn={(e) => {
                pressed.set(withSpring(1, SPRING));
                onPressIn?.(e);
            }}
            onPressOut={(e) => {
                pressed.set(withSpring(0, SPRING));
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
