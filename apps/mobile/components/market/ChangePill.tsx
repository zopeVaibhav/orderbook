import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { formatChange } from '@/lib/format';
import { Radius, useTheme } from '@/theme';

export function ChangePill({ value, solid = false }: { value: number | null; solid?: boolean }) {
    const { colors } = useTheme();
    if (value === null) {
        return (
            <Text variant="smallMedium" tone="muted">
                —
            </Text>
        );
    }
    const up = value >= 0;
    if (!solid) {
        return (
            <Text variant="smallMedium" tone={up ? 'profit' : 'loss'} numeric>
                {formatChange(value)}
            </Text>
        );
    }
    return (
        <View style={[styles.pill, { backgroundColor: up ? colors.profitSoft : colors.lossSoft }]}>
            <Text variant="smallMedium" tone={up ? 'profit' : 'loss'} numeric>
                {formatChange(value)}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    pill: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: Radius.sm,
        alignSelf: 'flex-start',
    },
});
