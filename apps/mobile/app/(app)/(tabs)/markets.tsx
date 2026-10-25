import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { MarketRow } from '@/components/market/MarketRow';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useMarkets, type Market } from '@/hooks/queries/useMarkets';
import { Fonts, Radius, Spacing, useTheme } from '@/theme';

const SORTS = ['Volume', 'Gainers', 'Losers'] as const;
type Sort = (typeof SORTS)[number];

function sortMarkets(markets: Market[], sort: Sort): Market[] {
    const list = [...markets];
    if (sort === 'Gainers')
        return list.sort((a, b) => (b.change24h ?? -Infinity) - (a.change24h ?? -Infinity));
    if (sort === 'Losers')
        return list.sort((a, b) => (a.change24h ?? Infinity) - (b.change24h ?? Infinity));
    return list.sort((a, b) => (b.volume24h ?? -1) - (a.volume24h ?? -1));
}

export default function MarketsScreen() {
    const { colors } = useTheme();
    const markets = useMarkets();
    const [query, setQuery] = useState('');
    const [sort, setSort] = useState<Sort>('Volume');

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        const filtered = (markets.data ?? []).filter(
            (m) => !q || m.base.toLowerCase().includes(q) || m.name.toLowerCase().includes(q),
        );
        return sortMarkets(filtered, sort);
    }, [markets.data, query, sort]);

    return (
        <Screen>
            <View style={styles.top}>
                <Text variant="title">Markets</Text>
                <View style={[styles.search, { backgroundColor: colors.secondary }]}>
                    <Search size={16} color={colors.mutedForeground} />
                    <TextInput
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Search markets"
                        placeholderTextColor={colors.mutedForeground}
                        autoCapitalize="characters"
                        autoCorrect={false}
                        returnKeyType="search"
                        style={[styles.input, { color: colors.foreground }]}
                    />
                    {query ? (
                        <PressableScale
                            accessibilityLabel="Clear search"
                            hitSlop={10}
                            onPress={() => setQuery('')}
                        >
                            <X size={16} color={colors.mutedForeground} />
                        </PressableScale>
                    ) : null}
                </View>
                <View style={styles.chips}>
                    {SORTS.map((s) => (
                        <Chip key={s} label={s} selected={s === sort} onPress={() => setSort(s)} />
                    ))}
                </View>
            </View>

            {markets.isPending ? (
                <View style={styles.skeletons}>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} height={48} />
                    ))}
                </View>
            ) : (
                <FlatList
                    showsVerticalScrollIndicator={false}
                    data={rows}
                    keyExtractor={(m) => m.id}
                    renderItem={({ item }) => <MarketRow market={item} />}
                    contentContainerStyle={styles.list}
                    keyboardDismissMode="on-drag"
                    keyboardShouldPersistTaps="handled"
                    ItemSeparatorComponent={() => (
                        <View style={[styles.separator, { backgroundColor: colors.border }]} />
                    )}
                    refreshControl={
                        <RefreshControl
                            refreshing={markets.isRefetching}
                            onRefresh={() => void markets.refetch()}
                            tintColor={colors.mutedForeground}
                        />
                    }
                    ListEmptyComponent={
                        markets.isError ? (
                            <EmptyState
                                title="Markets unavailable"
                                message="Could not reach the server."
                                actionLabel="Retry"
                                onAction={() => void markets.refetch()}
                            />
                        ) : (
                            <EmptyState
                                title="No matches"
                                message={`Nothing found for "${query}".`}
                            />
                        )
                    }
                />
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    top: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, gap: Spacing.md },
    search: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        height: 44,
        borderRadius: Radius.lg,
        paddingHorizontal: Spacing.md,
    },
    input: { flex: 1, fontFamily: Fonts.regular, fontSize: 15, paddingVertical: 0 },
    chips: { flexDirection: 'row', gap: Spacing.sm, paddingBottom: Spacing.sm },
    list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['3xl'] },
    separator: { height: StyleSheet.hairlineWidth },
    skeletons: { padding: Spacing.lg, gap: Spacing.lg },
});
