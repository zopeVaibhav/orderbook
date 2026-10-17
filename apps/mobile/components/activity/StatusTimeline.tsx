import { StyleSheet, View } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { OrderStatus } from '@repo/types';
import { Text } from '@/components/ui/Text';
import type { OrderDetails } from '@/hooks/queries/useAccount';
import { formatDayTime, formatPrice, formatSize } from '@/lib/format';
import { Spacing, useTheme } from '@/theme';

type StepState = 'done' | 'failed' | 'pending';

interface Step {
    title: string;
    state: StepState;
    time?: number;
    note?: string;
}

function buildSteps({ order, fills, filled, avgPrice }: OrderDetails): Step[] {
    const steps: Step[] = [{ title: 'Order placed', state: 'done', time: order.createdAt }];
    const quantity = parseFloat(order.quantity);
    const lastFill = fills[fills.length - 1];
    const progress = `${formatSize(filled)} of ${formatSize(quantity)} ${order.base}`;

    if (order.status === OrderStatus.FILLED) {
        const count = `${fills.length} ${fills.length === 1 ? 'fill' : 'fills'}`;
        steps.push({
            title: 'Order filled',
            state: 'done',
            time: lastFill?.ts ?? order.updatedAt,
            note:
                avgPrice !== null
                    ? `${count} · avg ${formatPrice(avgPrice)} ${order.quote}`
                    : undefined,
        });
        return steps;
    }

    if (lastFill) {
        steps.push({ title: 'Partially filled', state: 'done', time: lastFill.ts, note: progress });
    }

    if (order.status === OrderStatus.CANCELLED) {
        steps.push({ title: 'Cancelled', state: 'failed', time: order.updatedAt });
    } else if (order.status === OrderStatus.REJECTED) {
        steps.push({
            title: 'Rejected',
            state: 'failed',
            time: order.updatedAt,
            note: order.rejectReason ?? undefined,
        });
    } else {
        steps.push({ title: 'Waiting to fill', state: 'pending' });
    }
    return steps;
}

function StepIcon({ state }: { state: StepState }) {
    const { colors } = useTheme();
    if (state === 'pending') {
        return (
            <View style={[styles.icon, styles.hollow, { borderColor: colors.mutedForeground }]} />
        );
    }
    const Icon = state === 'done' ? Check : X;
    return (
        <View
            style={[
                styles.icon,
                { backgroundColor: state === 'done' ? colors.profit : colors.loss },
            ]}
        >
            <Icon size={13} strokeWidth={3} color="#ffffff" />
        </View>
    );
}

export function StatusTimeline({ details }: { details: OrderDetails }) {
    const { colors } = useTheme();
    const steps = buildSteps(details);

    return (
        <View style={[styles.root, { borderColor: colors.border }]}>
            <Text variant="title">Status</Text>
            <View>
                {steps.map((step, i) => {
                    const last = i === steps.length - 1;
                    return (
                        <View key={step.title} style={styles.step}>
                            <View style={styles.rail}>
                                <StepIcon state={step.state} />
                                {last ? null : (
                                    <View
                                        style={[styles.line, { backgroundColor: colors.border }]}
                                    />
                                )}
                            </View>
                            <View style={[styles.body, !last && styles.bodyGap]}>
                                <Text
                                    variant="bodyMedium"
                                    tone={step.state === 'pending' ? 'muted' : 'default'}
                                >
                                    {step.title}
                                </Text>
                                {step.time ? (
                                    <Text variant="small" tone="muted" numeric>
                                        {formatDayTime(step.time)}
                                    </Text>
                                ) : null}
                                {step.note ? (
                                    <Text variant="small" tone="muted" numeric>
                                        {step.note}
                                    </Text>
                                ) : null}
                            </View>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

const ICON = 22;

const styles = StyleSheet.create({
    root: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.xl,
        gap: Spacing.lg,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    step: { flexDirection: 'row', gap: Spacing.lg },
    rail: { width: ICON, alignItems: 'center' },
    icon: {
        width: ICON,
        height: ICON,
        borderRadius: ICON / 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    hollow: { borderWidth: 1.5 },
    line: { flex: 1, width: 1.5, marginVertical: Spacing.xs },
    body: { flex: 1, gap: 2, paddingTop: 1 },
    bodyGap: { paddingBottom: Spacing.xl },
});
