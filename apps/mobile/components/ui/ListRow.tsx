import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Spacing, useTheme } from '@/theme';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

interface ListRowProps {
    icon?: ReactNode;
    label: string;
    detail?: string;
    trailing?: ReactNode;
    destructive?: boolean;
    onPress?: () => void;
}

export function ListRow({ icon, label, detail, trailing, destructive, onPress }: ListRowProps) {
    const { colors } = useTheme();
    return (
        <PressableScale
            accessibilityRole={onPress ? 'button' : undefined}
            disabled={!onPress}
            scaleTo={0.985}
            onPress={onPress}
            style={styles.row}
        >
            {icon ? (
                <View style={[styles.icon, { backgroundColor: colors.secondary }]}>{icon}</View>
            ) : null}
            <Text variant="bodyMedium" tone={destructive ? 'loss' : 'default'} style={styles.label}>
                {label}
            </Text>
            {detail ? (
                <Text variant="small" tone="muted">
                    {detail}
                </Text>
            ) : null}
            {trailing ??
                (onPress && !destructive ? (
                    <ChevronRight size={18} color={colors.mutedForeground} />
                ) : null)}
        </PressableScale>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 52 },
    icon: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: { flex: 1 },
});
