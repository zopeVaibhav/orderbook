import { StyleSheet, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

interface SectionHeaderProps {
    title: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
    const { colors } = useTheme();
    return (
        <View style={styles.row}>
            <Text variant="title">{title}</Text>
            {actionLabel && onAction ? (
                <PressableScale
                    accessibilityRole="button"
                    hitSlop={10}
                    onPress={onAction}
                    style={styles.action}
                >
                    <Text variant="smallMedium" tone="muted">
                        {actionLabel}
                    </Text>
                    <ChevronRight size={14} color={colors.mutedForeground} />
                </PressableScale>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    action: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
