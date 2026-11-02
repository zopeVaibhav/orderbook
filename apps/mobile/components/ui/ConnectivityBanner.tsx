import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wifi, WifiOff } from 'lucide-react-native';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useTheme } from '@/theme';
import { Text } from './Text';

const HIDDEN = -120;
const SHOW = { duration: 280, easing: Easing.out(Easing.cubic) };
const HIDE = { duration: 240, easing: Easing.in(Easing.cubic) };
const ONLINE_LINGER_MS = 1800;

export function ConnectivityBanner() {
    const { isConnected, hasChanged } = useNetworkStatus();
    const { top } = useSafeAreaInsets();
    const { colors } = useTheme();
    const y = useSharedValue(HIDDEN);

    useEffect(() => {
        if (!hasChanged) return;
        const show = withTiming(0, SHOW);
        y.set(
            isConnected
                ? withSequence(show, withDelay(ONLINE_LINGER_MS, withTiming(HIDDEN, HIDE)))
                : show,
        );
    }, [isConnected, hasChanged, y]);

    const animated = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));
    const Icon = isConnected ? Wifi : WifiOff;
    const bg = isConnected ? colors.profit : colors.foreground;
    const fg = isConnected ? '#ffffff' : colors.background;

    return (
        <Animated.View
            pointerEvents="none"
            style={[styles.wrap, { top: top + 8 }, animated]}
            accessibilityLiveRegion="polite"
        >
            <View style={[styles.pill, { backgroundColor: bg }]}>
                <Icon size={14} color={fg} />
                <Text variant="smallMedium" style={{ color: fg }}>
                    {isConnected ? 'Back online' : 'No internet connection'}
                </Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 999 },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 9999,
    },
});
