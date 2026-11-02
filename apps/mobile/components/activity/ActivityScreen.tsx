import { useMemo } from 'react';
import { RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowDownLeft, ArrowUpRight, BellOff, CheckCheck } from 'lucide-react-native';
import type { UserFill } from '@repo/types';
import { BackHeader } from '@/components/ui/BackHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { FillListPlaceholder } from '@/components/ui/Placeholders';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useFills } from '@/hooks/queries/useAccount';
import { fillKey, useIsFillUnread } from '@/hooks/useUnreadCount';
import { formatDayHeading, formatPrice, formatRelative, formatSize } from '@/lib/format';
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
            onPress={() => {
                usePreferences.getState().markFillRead(fillKey(fill));
                router.push({
                    pathname: '/order-details/[id]',
                    params: { id: fill.clientOrderId },
                });
            }}
            style={styles.item}
        >
            <View
                style={[
                    styles.icon,
                    { backgroundColor: buy ? colors.profitSoft : colors.lossSoft },
                ]}
            >
                <Icon size={18} color={buy ? colors.profit : colors.loss} />
                {unread ? (
                    <View
                        style={[
                            styles.unread,
                            { backgroundColor: colors.loss, borderColor: colors.background },
                        ]}
                    />
                ) : null}
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
                <Text variant="caption" tone="muted" style={styles.time}>
                    {formatRelative(fill.ts)}
                </Text>
            </View>
        </PressableScale>
    );
}

interface FillSection {
    title: string;
    data: UserFill[];
}

function groupByDay(fills: UserFill[]): FillSection[] {
    const sections: FillSection[] = [];
    for (const fill of fills) {
        const title = formatDayHeading(fill.ts);
        const current = sections[sections.length - 1];
        if (current?.title === title) current.data.push(fill);
        else sections.push({ title, data: [fill] });
    }
    return sections;
}

export function ActivityScreen({ showBack = false }: { showBack?: boolean }) {
    const { colors } = useTheme();
    const fills = useFills();
    const isUnread = useIsFillUnread();
    const markAllRead = usePreferences((s) => s.markAllFillsRead);
    const sections = useMemo(() => groupByDay(fills.data ?? []), [fills.data]);
    const hasUnread = (fills.data ?? []).some(isUnread);
    const markAllButton = hasUnread ? (
        <IconButton
            label="Mark all as read"
            icon={<CheckCheck size={18} color={colors.foreground} />}
            onPress={markAllRead}
        />
    ) : null;

    return (
        <Screen>
            {showBack ? <BackHeader title="Activity" trailing={markAllButton} /> : null}
            <View style={styles.top}>
                {showBack ? null : (
                    <View style={styles.titleRow}>
                        <Text variant="title">Activity</Text>
                        {markAllButton}
                    </View>
                )}
                <Text variant="small" tone="muted">
                    Fills on your orders, newest first.
                </Text>
            </View>
            {fills.isPending ? (
                <View style={styles.list}>
                    <FillListPlaceholder />
                </View>
            ) : (
                <SectionList
                    showsVerticalScrollIndicator={false}
                    sections={sections}
                    stickySectionHeadersEnabled={false}
                    keyExtractor={fillKey}
                    renderItem={({ item }) => <FillItem fill={item} unread={isUnread(item)} />}
                    renderSectionHeader={({ section }) => (
                        <Text variant="smallMedium" tone="muted" style={styles.sectionHeader}>
                            {section.title}
                        </Text>
                    )}
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
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 36,
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
    time: { letterSpacing: 0 },
    unread: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 2,
    },
    separator: { height: StyleSheet.hairlineWidth },
    sectionHeader: { paddingTop: Spacing.lg, paddingBottom: Spacing.xs },
});
