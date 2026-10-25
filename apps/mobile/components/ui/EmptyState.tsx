import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Spacing } from '@/theme';
import { Button } from './Button';
import { Text } from './Text';

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
    fill?: boolean;
}

export function EmptyState({
    icon,
    title,
    message,
    actionLabel,
    onAction,
    fill = false,
}: EmptyStateProps) {
    return (
        <View style={[styles.wrap, fill && styles.fill]}>
            {icon}
            <Text variant="heading" style={styles.center}>
                {title}
            </Text>
            {message ? (
                <Text tone="muted" style={styles.center}>
                    {message}
                </Text>
            ) : null}
            {actionLabel && onAction ? (
                <Button
                    label={actionLabel}
                    onPress={onAction}
                    variant="outline"
                    size="md"
                    style={styles.action}
                />
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing['2xl'] },
    fill: { flex: 1, justifyContent: 'center' },
    center: { textAlign: 'center' },
    action: { marginTop: Spacing.sm },
});
