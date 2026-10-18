import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text, type AppTextProps } from '@/components/ui/Text';
import { usePriceFlash } from '@/hooks/usePriceFlash';
import { formatPrice } from '@/lib/format';
import { Radius } from '@/theme';

interface LivePriceProps {
    value: number | null;
    variant?: AppTextProps['variant'];
    style?: StyleProp<ViewStyle>;
}

export function LivePrice({ value, variant = 'bodyMedium', style }: LivePriceProps) {
    const flash = usePriceFlash(value);
    return (
        <Animated.View style={[styles.wrap, flash, style]}>
            <Text variant={variant} numeric>
                {value === null ? '—' : formatPrice(value)}
            </Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrap: { borderRadius: Radius.sm, paddingHorizontal: 4, marginHorizontal: -4 },
});
