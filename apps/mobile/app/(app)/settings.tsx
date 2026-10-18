import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import * as Application from 'expo-application';
import { Info, LogOut, Moon, Vibrate } from 'lucide-react-native';
import { BackHeader } from '@/components/ui/BackHeader';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { confirmSignOut } from '@/lib/confirm-sign-out';
import { usePreferences, type ThemeMode } from '@/store/preferences';
import { Radius, Spacing, useTheme } from '@/theme';

const MODES: { value: ThemeMode; label: string }[] = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
];

export default function SettingsScreen() {
    const { colors } = useTheme();
    const themeMode = usePreferences((s) => s.themeMode);
    const setThemeMode = usePreferences((s) => s.setThemeMode);
    const haptics = usePreferences((s) => s.haptics);
    const setHaptics = usePreferences((s) => s.setHaptics);
    const version = `${Application.nativeApplicationVersion ?? '1.0.0'} (${Application.nativeBuildVersion ?? '1'})`;

    return (
        <Screen>
            <BackHeader title="Settings" />
            <ScrollView contentContainerStyle={styles.content}>
                <Text variant="caption" tone="muted">
                    APPEARANCE
                </Text>
                <Card style={styles.card}>
                    <ListRow icon={<Moon size={18} color={colors.foreground} />} label="Theme" />
                    <View style={[styles.segment, { backgroundColor: colors.secondary }]}>
                        {MODES.map(({ value, label }) => {
                            const active = value === themeMode;
                            return (
                                <PressableScale
                                    key={value}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: active }}
                                    onPress={() => setThemeMode(value)}
                                    style={[
                                        styles.segmentItem,
                                        active && { backgroundColor: colors.background },
                                    ]}
                                >
                                    <Text variant="smallMedium" tone={active ? 'default' : 'muted'}>
                                        {label}
                                    </Text>
                                </PressableScale>
                            );
                        })}
                    </View>
                </Card>

                <Text variant="caption" tone="muted">
                    FEEDBACK
                </Text>
                <Card style={styles.card}>
                    <ListRow
                        icon={<Vibrate size={18} color={colors.foreground} />}
                        label="Haptics"
                        trailing={
                            <Switch
                                value={haptics}
                                onValueChange={setHaptics}
                                trackColor={{ true: colors.profit, false: colors.input }}
                                accessibilityLabel="Haptics"
                            />
                        }
                    />
                </Card>

                <Text variant="caption" tone="muted">
                    ABOUT
                </Text>
                <Card style={styles.card}>
                    <ListRow
                        icon={<Info size={18} color={colors.foreground} />}
                        label="Version"
                        detail={version}
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
    content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing['3xl'] },
    card: { paddingVertical: Spacing.xs, gap: Spacing.sm },
    segment: {
        flexDirection: 'row',
        padding: 3,
        borderRadius: Radius.lg,
        marginBottom: Spacing.md,
    },
    segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: Radius.md },
});
