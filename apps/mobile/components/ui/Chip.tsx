import { StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

const HEIGHT = 30;

interface ChipProps {
    label: string;
    selected?: boolean;
    quiet?: boolean;
    accessibilityLabel?: string;
    onPress: () => void;
}

export function Chip({
    label,
    selected = false,
    quiet = false,
    accessibilityLabel,
    onPress,
}: ChipProps) {
    const { colors } = useTheme();
    const idleBorder = quiet ? 'transparent' : colors.border;
    return (
        <PressableScale
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={accessibilityLabel ?? label}
            feedback="fade"
            onPress={onPress}
            style={[
                styles.chip,
                {
                    backgroundColor: selected ? colors.secondary : 'transparent',
                    borderColor: selected ? colors.ring : idleBorder,
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
        height: HEIGHT,
        borderRadius: HEIGHT / 2,
        borderWidth: 1,
        paddingHorizontal: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
