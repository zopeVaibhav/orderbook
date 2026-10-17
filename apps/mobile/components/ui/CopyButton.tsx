import * as Clipboard from 'expo-clipboard';
import { Copy } from 'lucide-react-native';
import { haptic } from '@/lib/haptics';
import { useTheme } from '@/theme';
import { PressableScale } from './PressableScale';

export function CopyButton({ value, label }: { value: string; label: string }) {
    const { colors } = useTheme();
    return (
        <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`Copy ${label}`}
            feedback="fade"
            hitSlop={10}
            onPress={() => {
                void Clipboard.setStringAsync(value).then(() => haptic.tap());
            }}
        >
            <Copy size={16} color={colors.profit} />
        </PressableScale>
    );
}
