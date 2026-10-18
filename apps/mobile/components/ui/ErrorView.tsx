import { StyleSheet, View } from 'react-native';
import { TriangleAlert } from 'lucide-react-native';
import { Spacing, useTheme } from '@/theme';
import { Button } from './Button';
import { Text } from './Text';

interface ErrorViewProps {
    title?: string;
    message: string;
    onRetry: () => void;
}

export function ErrorView({ title = 'Something went wrong', message, onRetry }: ErrorViewProps) {
    const { colors } = useTheme();
    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <TriangleAlert size={32} color={colors.loss} />
            <Text variant="title" style={styles.center}>
                {title}
            </Text>
            <Text tone="muted" style={styles.center}>
                {message}
            </Text>
            <Button label="Try again" onPress={onRetry} style={styles.button} />
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.md,
        padding: Spacing['2xl'],
    },
    center: { textAlign: 'center' },
    button: { alignSelf: 'stretch', marginTop: Spacing.lg },
});
