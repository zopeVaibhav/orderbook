import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';

const HUES = [
    '#f7931a',
    '#627eea',
    '#14f195',
    '#e84142',
    '#2775ca',
    '#8247e5',
    '#f0b90b',
    '#00aae4',
];

function hueFor(symbol: string): string {
    let hash = 0;
    for (const char of symbol) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    return HUES[hash % HUES.length] ?? '#737373';
}

export function CoinBadge({ symbol, size = 40 }: { symbol: string; size?: number }) {
    const hue = hueFor(symbol);
    return (
        <View
            style={[
                styles.badge,
                { width: size, height: size, borderRadius: size / 2, backgroundColor: `${hue}22` },
            ]}
        >
            <Text variant="smallMedium" style={{ color: hue, fontSize: size * 0.34 }}>
                {symbol.slice(0, 3)}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: { alignItems: 'center', justifyContent: 'center' },
});
