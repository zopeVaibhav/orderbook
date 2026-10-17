import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import type { OrderDetails } from '@/hooks/queries/useAccount';
import { formatPrice } from '@/lib/format';
import { Spacing, useTheme } from '@/theme';

function Cell({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.cell}>
            <Text variant="small" tone="muted">
                {label}
            </Text>
            <Text variant="heading" numeric>
                {value}
            </Text>
        </View>
    );
}

export function OrderSummarySplit({ details }: { details: OrderDetails }) {
    const { colors } = useTheme();
    const { order, avgPrice, total } = details;
    const limit = order.price ? parseFloat(order.price) : null;
    const priceLabel = avgPrice !== null ? 'Avg fill price' : 'Limit price';
    const price = avgPrice ?? limit;

    return (
        <View style={[styles.root, { borderColor: colors.border }]}>
            <Cell
                label={priceLabel}
                value={price !== null ? `${formatPrice(price)} ${order.quote}` : '—'}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Cell
                label="Total value"
                value={total > 0 ? `${formatPrice(total)} ${order.quote}` : '—'}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.xl,
        gap: Spacing.lg,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    cell: { flex: 1, gap: Spacing.xs },
    divider: { width: StyleSheet.hairlineWidth },
});
