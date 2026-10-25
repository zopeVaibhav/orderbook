import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleAlert, CircleCheck, Info } from 'lucide-react-native';
import { hideToast, useToast } from '@/store/toast';
import { Radius, Spacing, useTheme } from '@/theme';
import { Text } from './Text';

const VISIBLE_MS = 2600;

export function ToastHost() {
    const { colors } = useTheme();
    const { bottom } = useSafeAreaInsets();
    const { id, message, tone } = useToast();

    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(() => hideToast(id), VISIBLE_MS);
        return () => clearTimeout(timer);
    }, [id, message]);

    if (!message) return null;
    const Icon = tone === 'success' ? CircleCheck : tone === 'error' ? CircleAlert : Info;
    const accent =
        tone === 'success' ? colors.profit : tone === 'error' ? colors.loss : colors.foreground;

    return (
        <View pointerEvents="none" style={[styles.wrap, { bottom: bottom + 84 }]}>
            <Animated.View
                key={id}
                entering={FadeInDown.duration(220)}
                exiting={FadeOutDown.duration(180)}
                accessibilityLiveRegion="polite"
                style={[styles.toast, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
                <Icon size={16} color={accent} />
                <Text variant="smallMedium">{message}</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 1000 },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: Radius.full,
        borderWidth: 1,
        maxWidth: '90%',
    },
});
