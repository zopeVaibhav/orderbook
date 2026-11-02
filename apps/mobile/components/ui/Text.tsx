import { Text as RNText, type TextProps } from 'react-native';
import { TypeScale, useTheme, type Palette, type TypeVariant } from '@/theme';

type Tone = 'default' | 'muted' | 'profit' | 'loss' | 'inverse' | 'destructive';

export interface AppTextProps extends TextProps {
    variant?: TypeVariant;
    tone?: Tone;
    numeric?: boolean;
}

function toneColor(colors: Palette, tone: Tone): string {
    switch (tone) {
        case 'muted':
            return colors.mutedForeground;
        case 'profit':
            return colors.profit;
        case 'loss':
            return colors.loss;
        case 'inverse':
            return colors.primaryForeground;
        case 'destructive':
            return colors.destructive;
        default:
            return colors.foreground;
    }
}

export function Text({
    variant = 'body',
    tone = 'default',
    numeric = false,
    style,
    ...rest
}: AppTextProps) {
    const { colors } = useTheme();
    return (
        <RNText
            {...rest}
            style={[
                TypeScale[variant],
                { color: toneColor(colors, tone) },
                numeric && { fontVariant: ['tabular-nums'] },
                style,
            ]}
        />
    );
}
