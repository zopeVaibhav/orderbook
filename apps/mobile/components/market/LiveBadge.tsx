import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { useFeedStatus } from '@/store/feed';
import { Radius, useTheme } from '@/theme';

export function LiveBadge() {
    const { colors } = useTheme();
    const status = useFeedStatus((s) => s.status);
    const live = status === 'live';
    const pulse = useSharedValue(1);

    useEffect(() => {
        pulse.set(
            live
                ? withRepeat(
                      withTiming(0.3, { duration: 900, easing: Easing.inOut(Easing.ease) }),
                      -1,
                      true,
                  )
                : 1,
        );
    }, [live, pulse]);

    const dot = useAnimatedStyle(() => ({ opacity: pulse.get() }));
    const color = live ? colors.profit : colors.mutedForeground;
    const label = live ? 'Live' : status === 'idle' ? 'Offline' : 'Connecting';

    return (
        <View
            style={[styles.badge, { backgroundColor: colors.secondary }]}
            accessibilityLabel={`Feed ${label}`}
        >
            <Animated.View style={[styles.dot, { backgroundColor: color }, dot]} />
            <Text variant="caption" tone={live ? 'default' : 'muted'}>
                {label.toUpperCase()}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: Radius.full,
    },
    dot: { width: 7, height: 7, borderRadius: 4 },
});
