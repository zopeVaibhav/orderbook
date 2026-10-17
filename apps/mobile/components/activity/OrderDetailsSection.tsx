import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    LinearTransition,
    useAnimatedStyle,
    withTiming,
} from 'react-native-reanimated';
import { ChevronDown } from 'lucide-react-native';
import { CopyButton } from '@/components/ui/CopyButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import type { OrderDetails } from '@/hooks/queries/useAccount';
import { formatDayTime, formatPrice, formatSize } from '@/lib/format';
import { kindLabel, tifLabel } from '@/lib/order-status';
import { Spacing, useTheme } from '@/theme';

interface Row {
    label: string;
    value: string;
    copy?: boolean;
}

function buildRows({ order, fills, filled }: OrderDetails): Row[] {
    const makers = fills.filter((f) => f.role === 'MAKER').length;
    const takers = fills.length - makers;
    const roles = [makers ? `${makers} maker` : null, takers ? `${takers} taker` : null]
        .filter(Boolean)
        .join(', ');
    return [
        { label: 'Type', value: kindLabel(order.kind) },
        { label: 'Time in force', value: tifLabel(order.timeInForce) },
        {
            label: 'Limit price',
            value: order.price ? `${formatPrice(parseFloat(order.price))} ${order.quote}` : '—',
        },
        { label: 'Quantity', value: `${formatSize(parseFloat(order.quantity))} ${order.base}` },
        { label: 'Filled', value: `${formatSize(filled)} ${order.base}` },
        { label: 'Fills', value: fills.length ? `${fills.length} · ${roles}` : '0' },
        { label: 'Placed', value: formatDayTime(order.createdAt) },
        { label: 'Order ID', value: order.clientOrderId, copy: true },
    ];
}

export function OrderDetailsSection({ details }: { details: OrderDetails }) {
    const { colors } = useTheme();
    const [open, setOpen] = useState(false);
    const chevron = useAnimatedStyle(() => ({
        transform: [{ rotate: withTiming(open ? '180deg' : '0deg', { duration: 200 }) }],
    }));

    return (
        <Animated.View layout={LinearTransition.duration(220)} style={styles.root}>
            <PressableScale
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                feedback="fade"
                onPress={() => setOpen((v) => !v)}
                style={styles.header}
            >
                <Text variant="title">Details</Text>
                <Animated.View style={chevron}>
                    <ChevronDown size={20} color={colors.foreground} />
                </Animated.View>
            </PressableScale>
            {open ? (
                <Animated.View
                    entering={FadeIn.duration(180)}
                    exiting={FadeOut.duration(120)}
                    style={styles.rows}
                >
                    {buildRows(details).map((row) => (
                        <View key={row.label} style={styles.row}>
                            <Text tone="muted" style={styles.label}>
                                {row.label}
                            </Text>
                            <View style={styles.value}>
                                <Text
                                    numeric
                                    numberOfLines={1}
                                    ellipsizeMode="middle"
                                    style={styles.valueText}
                                >
                                    {row.value}
                                </Text>
                                {row.copy ? (
                                    <CopyButton value={row.value} label={row.label} />
                                ) : null}
                            </View>
                        </View>
                    ))}
                </Animated.View>
            ) : null}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    root: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.xl,
        overflow: 'hidden',
    },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rows: { gap: Spacing.lg, paddingTop: Spacing.xl },
    row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    label: { width: 112 },
    value: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    valueText: { flexShrink: 1 },
});
