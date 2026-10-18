import { StyleSheet } from 'react-native';
import { Radius, useTheme } from '@/theme';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

interface ChipProps {
    label: string;
    selected?: boolean;
    onPress: () => void;
}

export function Chip({ label, selected = false, onPress }: ChipProps) {
    const { colors } = useTheme();
    return (
        <PressableScale
            accessibilityRole="button"
            accessibilityState={{ selected }}
            scaleTo={0.95}
            onPress={onPress}
            style={[
                styles.chip,
                {
                    backgroundColor: selected ? colors.secondary : 'transparent',
                    borderColor: selected ? colors.foreground : colors.border,
                },
            ]}
        >
            <Text variant="smallMedium" tone={selected ? 'default' : 'muted'}>
                {label}
            </Text>
        </PressableScale>
    );
}

const styles = StyleSheet.create({
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: Radius.full,
        borderWidth: StyleSheet.hairlineWidth,
    },
});
