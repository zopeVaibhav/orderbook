import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Check, ChevronRight, Clock, X } from 'lucide-react-native';
import { Side } from '@repo/types';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import type { OrderDetails } from '@/hooks/queries/useAccount';
import { formatSize } from '@/lib/format';
import { kindLabel, statusLabel, statusState } from '@/lib/order-status';
import { Spacing, useTheme } from '@/theme';

export function OrderHero({ details }: { details: OrderDetails }) {
    const { colors } = useTheme();
    const { order, filled } = details;
    const state = statusState(order.status);
    const amount = filled > 0 ? filled : parseFloat(order.quantity);
    const Icon = state === 'done' ? Check : state === 'failed' ? X : Clock;
    const badge =
        state === 'done' ? colors.profit : state === 'failed' ? colors.loss : colors.secondary;

    return (
        <View style={[styles.root, { borderColor: colors.border }]}>
            <View style={[styles.badge, { backgroundColor: badge }]}>
                <Icon
                    size={28}
                    strokeWidth={2.6}
                    color={state === 'open' ? colors.mutedForeground : '#ffffff'}
                />
            </View>
            <Text variant="display" numeric style={styles.amount}>
                {formatSize(amount)} {order.base}
            </Text>
            <Text variant="bodyMedium" tone="muted">
                {order.side === Side.BID ? 'Buy' : 'Sell'} · {kindLabel(order.kind)} ·{' '}
                {statusLabel(order.status)}
            </Text>
            <PressableScale
                accessibilityRole="link"
                accessibilityLabel={`Open ${order.base}/${order.quote} market`}
                feedback="fade"
                hitSlop={8}
                onPress={() =>
                    router.push({ pathname: '/market/[id]', params: { id: order.marketId } })
                }
                style={styles.market}
            >
                <Text tone="muted">
                    {order.base}/{order.quote}
                </Text>
                <ChevronRight size={16} color={colors.mutedForeground} />
            </PressableScale>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.xl,
        gap: Spacing.xs,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    badge: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    amount: { fontSize: 24, lineHeight: 30 },
    market: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 2,
        marginTop: Spacing.md,
    },
});
