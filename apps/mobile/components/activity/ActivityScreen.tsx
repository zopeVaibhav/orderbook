import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ArrowDownLeft, ArrowUpRight, BellOff } from 'lucide-react-native';
import type { UserFill } from '@repo/types';
import { BackHeader } from '@/components/ui/BackHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { FillListPlaceholder } from '@/components/ui/Placeholders';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useFills } from '@/hooks/queries/useAccount';
import { formatPrice, formatRelative, formatSize } from '@/lib/format';
import { usePreferences } from '@/store/preferences';
import { Spacing, useTheme } from '@/theme';

function FillItem({ fill, unread }: { fill: UserFill; unread: boolean }) {
    const { colors } = useTheme();
    const buy = fill.side === 'BID';
    const Icon = buy ? ArrowDownLeft : ArrowUpRight;
    const total = parseFloat(fill.price) * parseFloat(fill.quantity);

    return (
        <PressableScale
            accessibilityRole="button"
            scaleTo={0.985}
            onPress={() => router.push({ pathname: '/market/[id]', params: { id: fill.marketId } })}
            style={styles.item}
        >
            <View
                style={[
                    styles.icon,
                    { backgroundColor: buy ? colors.profitSoft : colors.lossSoft },
                ]}
            >
                <Icon size={18} color={buy ? colors.profit : colors.loss} />
            </View>
            <View style={styles.body}>
                <Text variant="bodyMedium">
                    {buy ? 'Bought' : 'Sold'} {formatSize(parseFloat(fill.quantity))} {fill.base}
                </Text>
                <Text variant="small" tone="muted" numeric>
                    at {formatPrice(parseFloat(fill.price))} {fill.quote} ·{' '}
                    {fill.role === 'MAKER' ? 'Maker' : 'Taker'}
                </Text>
            </View>
            <View style={styles.meta}>
                <Text variant="smallMedium" numeric>
                    {formatPrice(total)}
                </Text>
                <Text variant="caption" tone="muted">
                    {formatRelative(fill.ts)}
                </Text>
            </View>
            {unread ? <View style={[styles.unread, { backgroundColor: colors.loss }]} /> : null}
        </PressableScale>
    );
}

export function ActivityScreen({ showBack = false }: { showBack?: boolean }) {
    const { colors } = useTheme();
    const fills = useFills();
    const seenAt = usePreferences((s) => s.notificationsSeenAt);
    const markSeen = usePreferences((s) => s.markNotificationsSeen);
    const [baseline, setBaseline] = useState(seenAt);

    useFocusEffect(
        useCallback(() => {
            setBaseline(usePreferences.getState().notificationsSeenAt);
            return () => markSeen();
        }, [markSeen]),
    );

    return (
        <Screen>
            {showBack ? <BackHeader title="Activity" /> : null}
            <View style={styles.top}>
                {showBack ? null : <Text variant="title">Activity</Text>}
                <Text variant="small" tone="muted">
                    Fills on your orders, newest first.
                </Text>
            </View>
            {fills.isPending ? (
                <View style={styles.list}>
                    <FillListPlaceholder />
                </View>
            ) : (
                <FlatList
                    showsVerticalScrollIndicator={false}
                    data={fills.data ?? []}
                    keyExtractor={(f) => `${f.tradeId}-${f.clientOrderId}`}
                    renderItem={({ item }) => <FillItem fill={item} unread={item.ts > baseline} />}
                    contentContainerStyle={styles.list}
                    ItemSeparatorComponent={() => (
                        <View style={[styles.separator, { backgroundColor: colors.border }]} />
                    )}
                    refreshControl={
                        <RefreshControl
                            refreshing={fills.isRefetching}
                            onRefresh={() => void fills.refetch()}
                            tintColor={colors.mutedForeground}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <EmptyState
                                icon={<BellOff size={28} color={colors.mutedForeground} />}
                                title={fills.isError ? 'Activity unavailable' : 'Nothing yet'}
                                message={
                                    fills.isError
                                        ? 'Could not reach the server.'
                                        : 'When one of your orders fills, it shows up here.'
                                }
                                actionLabel={fills.isError ? 'Retry' : undefined}
                                onAction={fills.isError ? () => void fills.refetch() : undefined}
                            />
                        </View>
                    }
                />
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    top: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.md,
        gap: 2,
    },
    list: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingBottom: Spacing['3xl'] },
    empty: { flex: 1, justifyContent: 'center' },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.md,
    },
    icon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    body: { flex: 1, gap: 2 },
    meta: { alignItems: 'flex-end', gap: 2 },
    unread: { position: 'absolute', left: -10, width: 6, height: 6, borderRadius: 3 },
    separator: { height: StyleSheet.hairlineWidth },
});
