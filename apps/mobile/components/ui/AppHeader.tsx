import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useSession } from '@/store/session';
import { Radius, Spacing, useTheme } from '@/theme';
import { Avatar } from './Avatar';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export function AppHeader({ title }: { title: string }) {
    const { colors } = useTheme();
    const user = useSession((s) => s.user);

    return (
        <View style={styles.row}>
            <View style={[styles.mark, { backgroundColor: colors.foreground }]}>
                <View style={[styles.markBar, styles.markAsk, { backgroundColor: colors.loss }]} />
                <View
                    style={[styles.markBar, styles.markBid, { backgroundColor: colors.profit }]}
                />
            </View>
            <Text variant="title" style={styles.title}>
                {title}
            </Text>
            <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Search markets"
                hitSlop={10}
                scaleTo={0.9}
                onPress={() => router.navigate('/markets')}
                style={styles.icon}
            >
                <Search size={22} color={colors.foreground} />
            </PressableScale>
            <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Open profile"
                hitSlop={6}
                scaleTo={0.92}
                onPress={() => router.navigate('/profile')}
            >
                <Avatar name={user?.name ?? ''} image={user?.image ?? null} size={36} />
            </PressableScale>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.md,
    },
    mark: {
        width: 34,
        height: 34,
        borderRadius: Radius.lg,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 3,
        paddingBottom: 8,
    },
    markBar: { width: 5, borderRadius: 2 },
    markAsk: { height: 10 },
    markBid: { height: 17 },
    title: { flex: 1 },
    icon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
