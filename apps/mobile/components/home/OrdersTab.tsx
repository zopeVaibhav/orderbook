import { Alert, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ClipboardList } from 'lucide-react-native';
import type { UserOrder } from '@repo/types';
import { CoinBadge } from '@/components/market/CoinBadge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PressableScale } from '@/components/ui/PressableScale';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useCancelOrder, useOpenOrders } from '@/hooks/queries/useAccount';
import { formatPrice, formatRelative, formatSize } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { Radius, Spacing, useTheme } from '@/theme';

function OrderRow({ order }: { order: UserOrder }) {
    const { colors } = useTheme();
    const cancel = useCancelOrder();
    const buy = order.side === 'BID';
    const quantity = parseFloat(order.quantity);
    const filled = parseFloat(order.filledQuantity);
    const progress = quantity > 0 ? filled / quantity : 0;

    const onCancel = () =>
        Alert.alert(
            'Cancel order?',
            `${buy ? 'Buy' : 'Sell'} ${formatSize(quantity)} ${order.base}`,
            [
                { text: 'Keep', style: 'cancel' },
                {
                    text: 'Cancel order',
                    style: 'destructive',
                    onPress: () =>
                        cancel.mutate(order.clientOrderId, {
                            onSuccess: () => haptic.success(),
                            onError: () => haptic.error(),
                        }),
                },
            ],
        );

    return (
        <PressableScale
            accessibilityRole="button"
            scaleTo={0.985}
            onPress={() =>
                router.push({ pathname: '/market/[id]', params: { id: order.marketId } })
            }
            style={[styles.row, { borderColor: colors.border }]}
        >
            <CoinBadge symbol={order.base} size={32} />
            <View style={styles.flex}>
                <View style={styles.inline}>
                    <View
                        style={[
                            styles.side,
                            { backgroundColor: buy ? colors.profitSoft : colors.lossSoft },
                        ]}
                    >
                        <Text variant="caption" tone={buy ? 'profit' : 'loss'}>
                            {buy ? 'BUY' : 'SELL'}
                        </Text>
                    </View>
                    <Text variant="bodyMedium">
                        {order.base}/{order.quote}
                    </Text>
                </View>
                <Text variant="small" tone="muted" numeric>
                    {formatSize(filled)} / {formatSize(quantity)} at{' '}
                    {order.price ? formatPrice(parseFloat(order.price)) : 'market'}
                </Text>
                <View style={[styles.track, { backgroundColor: colors.muted }]}>
                    <View
                        style={[
                            styles.fill,
                            {
                                width: `${Math.round(progress * 100)}%`,
                                backgroundColor: buy ? colors.profit : colors.loss,
                            },
                        ]}
                    />
                </View>
            </View>
            <View style={styles.end}>
                <Text variant="caption" tone="muted">
                    {formatRelative(order.createdAt)}
                </Text>
                <Button
                    label="Cancel"
                    variant="outline"
                    size="md"
                    loading={cancel.isPending}
                    onPress={onCancel}
                    style={styles.cancel}
                />
            </View>
        </PressableScale>
    );
}

export function OrdersTab() {
    const { colors } = useTheme();
    const orders = useOpenOrders();

    return (
        <View style={styles.body}>
            {orders.isPending ? (
                [0, 1, 2].map((i) => <Skeleton key={i} height={64} />)
            ) : (orders.data ?? []).length === 0 ? (
                <EmptyState
                    icon={<ClipboardList size={28} color={colors.mutedForeground} />}
                    title={orders.isError ? 'Orders unavailable' : 'No open orders'}
                    message={
                        orders.isError
                            ? 'Could not reach the server.'
                            : 'Orders resting on the book show up here until they fill.'
                    }
                    actionLabel={orders.isError ? 'Retry' : undefined}
                    onAction={orders.isError ? () => void orders.refetch() : undefined}
                />
            ) : (
                (orders.data ?? []).map((o) => <OrderRow key={o.clientOrderId} order={o} />)
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    body: { padding: Spacing.lg, gap: Spacing.md },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    flex: { flex: 1, gap: 4 },
    inline: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    side: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm },
    track: { height: 3, borderRadius: 2, overflow: 'hidden', marginTop: 2 },
    fill: { height: 3 },
    end: { alignItems: 'flex-end', gap: Spacing.sm },
    cancel: { height: 32, paddingHorizontal: 14 },
});
