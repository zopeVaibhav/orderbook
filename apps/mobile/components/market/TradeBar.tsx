import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Side } from '@repo/types';
import { Button } from '@/components/ui/Button';
import { Spacing, useTheme } from '@/theme';

export function TradeBar({ marketId }: { marketId: string }) {
    const { colors } = useTheme();
    const { bottom } = useSafeAreaInsets();
    const open = (side: Side) =>
        router.push({ pathname: '/order/[id]', params: { id: marketId, side } });

    return (
        <View
            style={[
                styles.bar,
                {
                    paddingBottom: bottom + Spacing.sm,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                },
            ]}
        >
            <Button
                label="Buy"
                variant="profit"
                onPress={() => open(Side.BID)}
                style={styles.button}
            />
            <Button
                label="Sell"
                variant="loss"
                onPress={() => open(Side.ASK)}
                style={styles.button}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    bar: {
        flexDirection: 'row',
        gap: Spacing.md,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.sm,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    button: { flex: 1 },
});
