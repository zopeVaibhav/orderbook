import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
    ArrowLeft,
    Bell,
    ChevronRight,
    History,
    LockKeyhole,
    LogOut,
    Settings,
    ShieldCheck,
    Wallet,
} from 'lucide-react-native';
import { CoinBadge } from '@/components/market/CoinBadge';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import { ListRow } from '@/components/ui/ListRow';
import { BalanceRowPlaceholder } from '@/components/ui/Placeholders';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Text } from '@/components/ui/Text';
import { useBalances, usePortfolio } from '@/hooks/queries/useAccount';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { confirmSignOut } from '@/lib/confirm-sign-out';
import { formatSize, formatUsd } from '@/lib/format';
import { useSession } from '@/store/session';
import { Radius, Spacing, useTheme } from '@/theme';

function BalanceRow({
    icon,
    value,
    label,
}: {
    icon: React.ReactNode;
    value: string;
    label: string;
}) {
    const { colors } = useTheme();
    return (
        <View style={[styles.balanceRow, { borderColor: colors.border }]}>
            {icon}
            <View style={styles.flex}>
                <Text variant="heading" numeric>
                    {value}
                </Text>
                <Text variant="small" tone="muted">
                    {label}
                </Text>
            </View>
        </View>
    );
}

export default function ProfileScreen() {
    const { colors } = useTheme();
    const user = useSession((s) => s.user);
    const balances = useBalances();
    const portfolio = usePortfolio();
    const unread = useUnreadCount();
    const assets = (balances.data ?? []).filter(
        (b) => parseFloat(b.available) + parseFloat(b.locked) > 0,
    );

    return (
        <Screen>
            <View style={styles.topBar}>
                <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                    hitSlop={12}
                    scaleTo={0.9}
                    onPress={() => router.back()}
                >
                    <ArrowLeft size={20} color={colors.foreground} />
                </PressableScale>
                <View style={styles.flex} />
                <IconButton
                    label="Activity"
                    badge={unread}
                    icon={<Bell size={18} color={colors.foreground} />}
                    onPress={() => router.push('/activity')}
                />
                <IconButton
                    label="Settings"
                    icon={<Settings size={18} color={colors.foreground} />}
                    onPress={() => router.push('/settings')}
                />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={balances.isRefetching}
                        onRefresh={() => void balances.refetch()}
                        tintColor={colors.mutedForeground}
                        progressBackgroundColor={colors.card}
                        colors={[colors.foreground]}
                    />
                }
            >
                <Animated.View entering={FadeInDown.duration(320)} style={styles.identity}>
                    <Avatar name={user?.name ?? ''} image={user?.image ?? null} size={64} />
                    <View style={styles.nameRow}>
                        <Text variant="display" style={styles.flexShrink}>
                            {user?.name}
                        </Text>
                        {user?.isAdmin ? (
                            <View style={[styles.chip, { backgroundColor: colors.secondary }]}>
                                <ShieldCheck size={13} color={colors.foreground} />
                                <Text variant="caption">ADMIN</Text>
                            </View>
                        ) : null}
                    </View>
                    <Text tone="muted">{user?.email}</Text>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(60).duration(320)}>
                    {portfolio.isPending || !portfolio.data ? (
                        <>
                            <BalanceRowPlaceholder />
                            <BalanceRowPlaceholder />
                        </>
                    ) : (
                        <>
                            <BalanceRow
                                icon={<Wallet size={20} color={colors.mutedForeground} />}
                                value={`${formatUsd(portfolio.data.cash)} USDC`}
                                label="Available to trade"
                            />
                            <BalanceRow
                                icon={<LockKeyhole size={20} color={colors.mutedForeground} />}
                                value={`${formatUsd(portfolio.data.inOrders)} USDC`}
                                label="Reserved in open orders"
                            />
                        </>
                    )}
                </Animated.View>

                {assets.length > 0 ? (
                    <Animated.View
                        entering={FadeInDown.delay(120).duration(320)}
                        style={styles.section}
                    >
                        <SectionHeader title="Assets" />
                        {assets.map((b) => (
                            <View key={b.asset} style={styles.asset}>
                                <CoinBadge symbol={b.asset} size={32} />
                                <Text variant="bodyMedium" style={styles.flex}>
                                    {b.asset}
                                </Text>
                                <Text variant="bodyMedium" numeric>
                                    {formatSize(parseFloat(b.available) + parseFloat(b.locked))}
                                </Text>
                            </View>
                        ))}
                    </Animated.View>
                ) : null}

                <Animated.View entering={FadeInDown.delay(180).duration(320)}>
                    <ListRow
                        icon={<History size={18} color={colors.foreground} />}
                        label="Activity"
                        onPress={() => router.push('/activity')}
                    />
                    <ListRow
                        icon={<Settings size={18} color={colors.foreground} />}
                        label="Settings"
                        onPress={() => router.push('/settings')}
                    />
                    <ListRow
                        icon={<LogOut size={18} color={colors.loss} />}
                        label="Sign out"
                        destructive
                        trailing={<ChevronRight size={18} color={colors.loss} />}
                        onPress={confirmSignOut}
                    />
                </Animated.View>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingHorizontal: Spacing.lg,
        height: 52,
    },
    content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['3xl'], gap: Spacing['2xl'] },
    identity: { gap: Spacing.sm, paddingTop: Spacing.sm },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
    flex: { flex: 1 },
    flexShrink: { flexShrink: 1 },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: Radius.full,
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.lg,
        paddingVertical: Spacing.lg,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    section: { gap: Spacing.md },
    asset: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
});
