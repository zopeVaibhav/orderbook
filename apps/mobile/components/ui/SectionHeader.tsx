import { StyleSheet, View } from 'react-native';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

interface SectionHeaderProps {
    title: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
    return (
        <View style={styles.row}>
            <Text variant="heading">{title}</Text>
            {actionLabel && onAction ? (
                <PressableScale accessibilityRole="button" hitSlop={10} onPress={onAction}>
                    <Text variant="smallMedium" tone="muted">
                        {actionLabel}
                    </Text>
                </PressableScale>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
