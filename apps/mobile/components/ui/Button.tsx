import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Radius, useTheme, type Palette } from '@/theme';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'profit' | 'loss';

interface ButtonProps {
    label: string;
    onPress?: () => void;
    variant?: Variant;
    size?: 'md' | 'lg';
    icon?: ReactNode;
    loading?: boolean;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
}

function paint(colors: Palette, variant: Variant): { bg: string; fg: string; border: string } {
    switch (variant) {
        case 'secondary':
            return { bg: colors.secondary, fg: colors.foreground, border: colors.secondary };
        case 'outline':
            return { bg: 'transparent', fg: colors.foreground, border: colors.border };
        case 'ghost':
            return { bg: 'transparent', fg: colors.foreground, border: 'transparent' };
        case 'profit':
            return { bg: colors.profit, fg: '#ffffff', border: colors.profit };
        case 'loss':
            return { bg: colors.loss, fg: '#ffffff', border: colors.loss };
        default:
            return { bg: colors.primary, fg: colors.primaryForeground, border: colors.primary };
    }
}

export function Button({
    label,
    onPress,
    variant = 'primary',
    size = 'lg',
    icon,
    loading = false,
    disabled = false,
    style,
}: ButtonProps) {
    const { colors } = useTheme();
    const { bg, fg, border } = paint(colors, variant);
    const inactive = disabled || loading;

    return (
        <PressableScale
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ disabled: inactive, busy: loading }}
            disabled={inactive}
            onPress={onPress}
            style={[
                styles.base,
                size === 'lg' ? styles.lg : styles.md,
                { backgroundColor: bg, borderColor: border, opacity: disabled ? 0.5 : 1 },
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={fg} />
            ) : (
                <View style={styles.row}>
                    {icon}
                    <Text variant="bodyMedium" style={{ color: fg }}>
                        {label}
                    </Text>
                </View>
            )}
        </PressableScale>
    );
}

const styles = StyleSheet.create({
    base: {
        borderRadius: Radius.full,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    lg: { height: 46 },
    md: { height: 36 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
