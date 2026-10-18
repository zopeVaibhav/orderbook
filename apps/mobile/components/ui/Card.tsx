import { StyleSheet, View, type ViewProps } from 'react-native';
import { Radius, Spacing, useTheme } from '@/theme';

export function Card({ style, ...rest }: ViewProps) {
    const { colors } = useTheme();
    return (
        <View
            {...rest}
            style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
                style,
            ]}
        />
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: Radius.xl,
        borderWidth: StyleSheet.hairlineWidth,
        padding: Spacing.lg,
    },
});
