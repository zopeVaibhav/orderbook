import { StyleSheet, TextInput, View } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { Fonts, Radius, Spacing, useTheme } from '@/theme';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

interface NumberFieldProps {
    label: string;
    unit: string;
    value: string;
    onChange: (value: string) => void;
    onStep: (direction: 1 | -1) => void;
    hint?: string;
    onHint?: () => void;
    error?: string | null;
    editable?: boolean;
    placeholder?: string;
}

export function NumberField({
    label,
    unit,
    value,
    onChange,
    onStep,
    hint,
    onHint,
    error,
    editable = true,
    placeholder = '0',
}: NumberFieldProps) {
    const { colors } = useTheme();
    const border = error ? colors.loss : colors.border;

    return (
        <View style={styles.wrap}>
            <View style={styles.labels}>
                <Text variant="smallMedium" tone="muted">
                    {label}
                </Text>
                {hint ? (
                    <PressableScale
                        accessibilityRole={onHint ? 'button' : undefined}
                        disabled={!onHint}
                        feedback="fade"
                        hitSlop={8}
                        onPress={onHint}
                    >
                        <Text variant="small" tone="muted" numeric>
                            {hint}
                        </Text>
                    </PressableScale>
                ) : null}
            </View>
            <View style={[styles.field, { borderColor: border, opacity: editable ? 1 : 0.5 }]}>
                <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel={`Decrease ${label}`}
                    disabled={!editable}
                    feedback="fade"
                    hitSlop={6}
                    onPress={() => onStep(-1)}
                    style={styles.stepper}
                >
                    <Minus size={16} color={colors.foreground} />
                </PressableScale>
                <TextInput
                    value={value}
                    onChangeText={(text) =>
                        onChange(text.replace(',', '.').replace(/[^0-9.]/g, ''))
                    }
                    editable={editable}
                    keyboardType="decimal-pad"
                    placeholder={placeholder}
                    placeholderTextColor={colors.mutedForeground}
                    accessibilityLabel={label}
                    style={[styles.input, { color: colors.foreground }]}
                />
                <Text variant="small" tone="muted">
                    {unit}
                </Text>
                <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel={`Increase ${label}`}
                    disabled={!editable}
                    feedback="fade"
                    hitSlop={6}
                    onPress={() => onStep(1)}
                    style={styles.stepper}
                >
                    <Plus size={16} color={colors.foreground} />
                </PressableScale>
            </View>
            {error ? (
                <Text variant="small" tone="loss">
                    {error}
                </Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { gap: 6 },
    labels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    field: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        height: 48,
        borderRadius: Radius.lg,
        borderWidth: 1,
        paddingHorizontal: Spacing.xs,
    },
    stepper: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
    input: {
        flex: 1,
        fontFamily: Fonts.medium,
        fontSize: 16,
        paddingVertical: 0,
        textAlign: 'center',
        fontVariant: ['tabular-nums'],
    },
});
