import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Bell, LogOut, Settings, ShieldCheck } from 'lucide-react-native';
import { CoinBadge } from '@/components/market/CoinBadge';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useBalances } from '@/hooks/queries/useAccount';
import { confirmSignOut } from '@/lib/confirm-sign-out';
import { formatSize } from '@/lib/format';
import { useSession } from '@/store/session';
import { Radius, Spacing, useTheme } from '@/theme';

export default function ProfileScreen() {
    const { colors } = useTheme();
    const user = useSession((s) => s.user);
    const balances = useBalances();

    return (
        <Screen>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={balances.isRefetching}
                        onRefresh={() => void balances.refetch()}
                        tintColor={colors.mutedForeground}
                    />
                }
            >
                <View style={styles.identity}>
                    <Avatar name={user?.name ?? ''} image={user?.image ?? null} size={72} />
                    <View style={styles.center}>
                        <Text variant="title">{user?.name}</Text>
                        <Text tone="muted">{user?.email}</Text>
                    </View>
                    {user?.isAdmin ? (
                        <View style={[styles.chip, { backgroundColor: colors.secondary }]}>
                            <ShieldCheck size={14} color={colors.foreground} />
                            <Text variant="caption">ADMIN</Text>
                        </View>
                    ) : null}
                </View>

                <View style={styles.section}>
                    <SectionHeader title="Balances" />
                    <Card style={styles.balances}>
                        {balances.isPending ? (
                            <Skeleton height={40} />
                        ) : (balances.data ?? []).length === 0 ? (
                            <Text tone="muted">No balances yet.</Text>
                        ) : (
                            (balances.data ?? []).map((b) => {
                                const locked = parseFloat(b.locked);
                                return (
                                    <View key={b.asset} style={styles.balance}>
                                        <CoinBadge symbol={b.asset} size={32} />
                                        <Text variant="bodyMedium" style={styles.flex}>
                                            {b.asset}
                                        </Text>
                                        <View style={styles.end}>
                                            <Text variant="bodyMedium" numeric>
                                                {formatSize(parseFloat(b.available))}
                                            </Text>
                                            {locked > 0 ? (
                                                <Text variant="caption" tone="muted" numeric>
                                                    {formatSize(locked)} in orders
                                                </Text>
                                            ) : null}
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </Card>
                </View>

                <Card style={styles.menu}>
                    <ListRow
                        icon={<Settings size={18} color={colors.foreground} />}
                        label="Settings"
                        onPress={() => router.push('/settings')}
                    />
                    <ListRow
                        icon={<Bell size={18} color={colors.foreground} />}
                        label="Activity"
                        onPress={() => router.navigate('/notifications')}
                    />
                    <ListRow
                        icon={<LogOut size={18} color={colors.loss} />}
                        label="Sign out"
                        destructive
                        onPress={confirmSignOut}
                    />
                </Card>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    content: { padding: Spacing.lg, gap: Spacing['2xl'], paddingBottom: Spacing['3xl'] },
    identity: { alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.lg },
    center: { alignItems: 'center', gap: 2 },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: Radius.full,
    },
    section: { gap: Spacing.md },
    balances: { gap: Spacing.md },
    balance: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    flex: { flex: 1 },
    end: { alignItems: 'flex-end' },
    menu: { paddingVertical: Spacing.xs },
});
