import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Spacing, useTheme } from '@/theme';
import { IconButton } from './IconButton';
import { Text } from './Text';

export function BackHeader({ title, trailing }: { title?: string; trailing?: ReactNode }) {
    const { colors } = useTheme();
    return (
        <View style={styles.row}>
            <IconButton
                label="Go back"
                icon={<ChevronLeft size={20} color={colors.foreground} />}
                onPress={() => router.back()}
            />
            {title ? (
                <Text variant="heading" style={styles.title} numberOfLines={1}>
                    {title}
                </Text>
            ) : (
                <View style={styles.title} />
            )}
            <View style={styles.trailing}>{trailing}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
    },
    title: { flex: 1, textAlign: 'center' },
    trailing: { width: 40, alignItems: 'flex-end' },
});
