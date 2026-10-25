import { useEffect, type ComponentType } from 'react';
import { StyleSheet, View, type ColorValue } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import type { LucideProps } from 'lucide-react-native';
import { Radius, useTheme } from '@/theme';
import { useTabPressed } from './TabButton';

const PRESS_IN_MS = 110;
const PRESS_OUT_MS = 260;

interface TabIconProps {
    icon: ComponentType<LucideProps>;
    focused: boolean;
    color: ColorValue;
}

export function TabIcon({ icon: Icon, focused, color }: TabIconProps) {
    const { colors } = useTheme();
    const pressed = useTabPressed();
    const layer = useSharedValue(0);

    useEffect(() => {
        layer.set(withTiming(pressed ? 1 : 0, { duration: pressed ? PRESS_IN_MS : PRESS_OUT_MS }));
    }, [pressed, layer]);

    const highlight = useAnimatedStyle(() => ({
        opacity: layer.get(),
        transform: [{ scaleX: 0.7 + layer.get() * 0.3 }],
    }));

    return (
        <View style={styles.pill}>
            <Animated.View
                pointerEvents="none"
                style={[styles.layer, { backgroundColor: colors.secondary }, highlight]}
            />
            <Icon
                size={21}
                color={typeof color === 'string' ? color : colors.foreground}
                strokeWidth={focused ? 2.2 : 1.8}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    pill: {
        width: 56,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    layer: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        borderRadius: Radius.full,
    },
});
