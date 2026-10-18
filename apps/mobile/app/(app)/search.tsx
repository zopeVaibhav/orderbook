import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, History, TrendingUp, X } from 'lucide-react-native';
import { MarketRow } from '@/components/market/MarketRow';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useMarkets, type Market } from '@/hooks/queries/useMarkets';
import { usePreferences } from '@/store/preferences';
import { Fonts, Radius, Spacing, useTheme } from '@/theme';

const FILTERS = ['All', 'Gainers', 'Losers', 'Most traded'] as const;
type Filter = (typeof FILTERS)[number];
const TRENDING = 6;

function applyFilter(markets: Market[], filter: Filter): Market[] {
    const list = [...markets];
    switch (filter) {
        case 'Gainers':
            return list
                .filter((m) => (m.change24h ?? 0) > 0)
                .sort((a, b) => (b.change24h ?? 0) - (a.change24h ?? 0));
        case 'Losers':
            return list
                .filter((m) => (m.change24h ?? 0) < 0)
                .sort((a, b) => (a.change24h ?? 0) - (b.change24h ?? 0));
        case 'Most traded':
            return list.sort((a, b) => (b.volume24h ?? -1) - (a.volume24h ?? -1));
        default:
            return list;
    }
}

function matches(market: Market, query: string): boolean {
    const q = query.toLowerCase();
    return (
        market.base.toLowerCase().includes(q) ||
        market.name.toLowerCase().includes(q) ||
        `${market.base}/${market.quote}`.toLowerCase().includes(q)
    );
}

export default function SearchScreen() {
    const { colors } = useTheme();
    const markets = useMarkets();
    const recentSearches = usePreferences((s) => s.recentSearches);
    const pushRecentSearch = usePreferences((s) => s.pushRecentSearch);
    const clearRecentSearches = usePreferences((s) => s.clearRecentSearches);
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<Filter>('All');
    const trimmed = query.trim();
    const browsing = trimmed === '' && filter === 'All';

    const results = useMemo(() => {
        const list = applyFilter(markets.data ?? [], filter);
        return trimmed ? list.filter((m) => matches(m, trimmed)) : list;
    }, [markets.data, filter, trimmed]);

    const trending = useMemo(
        () =>
            [...(markets.data ?? [])]
                .sort((a, b) => Math.abs(b.change24h ?? 0) - Math.abs(a.change24h ?? 0))
                .slice(0, TRENDING),
        [markets.data],
    );

    const remember = () => {
        if (trimmed) pushRecentSearch(trimmed);
    };

    return (
        <Screen>
            <View style={[styles.bar, { borderColor: colors.border }]}>
                <PressableScale
                    accessibilityLabel="Go back"
                    hitSlop={10}
                    onPress={() => router.back()}
                >
                    <ArrowLeft size={22} color={colors.foreground} />
                </PressableScale>
                <TextInput
                    autoFocus
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={remember}
                    placeholder='Search "BTC" or "Ethereum"'
                    placeholderTextColor={colors.mutedForeground}
                    autoCorrect={false}
                    autoCapitalize="characters"
                    returnKeyType="search"
                    style={[styles.input, { color: colors.foreground }]}
                />
                {query ? (
                    <PressableScale
                        accessibilityLabel="Clear search"
                        hitSlop={10}
                        onPress={() => setQuery('')}
                    >
                        <X size={20} color={colors.mutedForeground} />
                    </PressableScale>
                ) : null}
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chips}
                style={styles.chipsBar}
            >
                {FILTERS.map((f) => (
                    <Chip key={f} label={f} selected={f === filter} onPress={() => setFilter(f)} />
                ))}
            </ScrollView>

            {browsing ? (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    contentContainerStyle={styles.browse}
                >
                    {recentSearches.length > 0 ? (
                        <View style={styles.section}>
                            <View style={styles.sectionHead}>
                                <Text variant="heading">Recent searches</Text>
                                <PressableScale hitSlop={10} onPress={clearRecentSearches}>
                                    <Text variant="smallMedium" tone="muted">
                                        Clear
                                    </Text>
                                </PressableScale>
                            </View>
                            {recentSearches.map((q) => (
                                <PressableScale
                                    key={q}
                                    accessibilityRole="button"
                                    scaleTo={0.98}
                                    onPress={() => setQuery(q)}
                                    style={styles.recent}
                                >
                                    <History size={18} color={colors.mutedForeground} />
                                    <Text>{q}</Text>
                                </PressableScale>
                            ))}
                        </View>
                    ) : null}

                    <View style={styles.section}>
                        <Text variant="heading">Trending now</Text>
                        <View style={styles.grid}>
                            {trending.map((m) => (
                                <PressableScale
                                    key={m.id}
                                    accessibilityRole="button"
                                    scaleTo={0.97}
                                    onPress={() =>
                                        router.push({
                                            pathname: '/market/[id]',
                                            params: { id: m.id },
                                        })
                                    }
                                    style={[styles.trend, { borderColor: colors.border }]}
                                >
                                    <TrendingUp size={16} color={colors.mutedForeground} />
                                    <Text
                                        variant="smallMedium"
                                        numberOfLines={1}
                                        style={styles.flex}
                                    >
                                        {m.name}
                                    </Text>
                                </PressableScale>
                            ))}
                        </View>
                    </View>
                </ScrollView>
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={(m) => m.id}
                    renderItem={({ item }) => (
                        <View onTouchStart={remember}>
                            <MarketRow market={item} />
                        </View>
                    )}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    contentContainerStyle={styles.list}
                    ItemSeparatorComponent={() => (
                        <View style={[styles.separator, { backgroundColor: colors.border }]} />
                    )}
                    ListEmptyComponent={
                        <EmptyState
                            title="No matches"
                            message={
                                trimmed
                                    ? `Nothing found for "${trimmed}".`
                                    : 'No markets in this filter yet.'
                            }
                        />
                    }
                />
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingHorizontal: Spacing.lg,
        height: 56,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    input: { flex: 1, fontFamily: Fonts.regular, fontSize: 17, paddingVertical: 0 },
    chipsBar: { flexGrow: 0 },
    chips: { gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
    browse: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['3xl'], gap: Spacing['2xl'] },
    section: { gap: Spacing.md },
    sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    recent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.lg,
        paddingVertical: Spacing.sm,
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
    trend: {
        flexBasis: '47%',
        flexGrow: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        height: 56,
        borderRadius: Radius.lg,
        borderWidth: StyleSheet.hairlineWidth,
    },
    flex: { flex: 1 },
    list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['3xl'] },
    separator: { height: StyleSheet.hairlineWidth },
});
