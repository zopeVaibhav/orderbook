import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { PressableScale } from '@/components/ui/PressableScale';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Text } from '@/components/ui/Text';
import { useMarkets, type Market } from '@/hooks/queries/useMarkets';
import { usePreferences } from '@/store/preferences';
import { Spacing } from '@/theme';
import { ChangePill } from './ChangePill';
import { CoinBadge } from './CoinBadge';

export function RecentStrip() {
    const markets = useMarkets();
    const recentIds = usePreferences((s) => s.recentMarkets);

    const recent = useMemo(() => {
        const byId = new Map((markets.data ?? []).map((m) => [m.id, m]));
        return recentIds.map((id) => byId.get(id)).filter((m): m is Market => m !== undefined);
    }, [markets.data, recentIds]);

    if (recent.length === 0) return null;

    return (
        <View style={styles.section}>
            <SectionHeader title="Recently viewed" />
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.row}
                style={styles.bleed}
            >
                {recent.map((m) => (
                    <PressableScale
                        key={m.id}
                        accessibilityRole="button"
                        accessibilityLabel={`${m.base} ${m.quote}`}
                        scaleTo={0.94}
                        onPress={() =>
                            router.push({ pathname: '/market/[id]', params: { id: m.id } })
                        }
                        style={styles.item}
                    >
                        <CoinBadge symbol={m.base} size={40} />
                        <Text variant="smallMedium" numberOfLines={1}>
                            {m.base}
                        </Text>
                        <ChangePill value={m.change24h} />
                    </PressableScale>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    section: { gap: Spacing.md },
    bleed: { marginHorizontal: -Spacing.lg },
    row: { gap: Spacing.lg, paddingHorizontal: Spacing.lg },
    item: { width: 60, alignItems: 'center', gap: 4 },
});
