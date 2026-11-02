import { StyleSheet, View } from 'react-native';
import { TriangleAlert, WifiOff } from 'lucide-react-native';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import type { CandleFailure } from '@/store/candles';
import { Spacing, useTheme } from '@/theme';

export function ChartStatus({
    failure,
    onRetry,
}: {
    failure: Exclude<CandleFailure, null>;
    onRetry: () => void;
}) {
    const { colors } = useTheme();
    const offline = failure === 'offline';
    const Icon = offline ? WifiOff : TriangleAlert;

    return (
        <View style={styles.root} accessibilityLiveRegion="polite">
            <Icon size={22} color={colors.mutedForeground} />
            <Text variant="bodyMedium">
                {offline ? "You're offline" : "Couldn't load the chart"}
            </Text>
            <Text variant="small" tone="muted" style={styles.center}>
                {offline
                    ? 'The chart loads once you are back online.'
                    : 'Check your connection and try again.'}
            </Text>
            {offline ? null : <Chip label="Try again" onPress={onRetry} />}
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.xl,
    },
    center: { textAlign: 'center', marginBottom: Spacing.sm },
});
