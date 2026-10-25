import { ScrollView, StyleSheet, Switch } from 'react-native';
import * as Application from 'expo-application';
import { Info, LogOut, Moon, Vibrate } from 'lucide-react-native';
import { BackHeader } from '@/components/ui/BackHeader';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { confirmSignOut } from '@/lib/confirm-sign-out';
import { usePreferences } from '@/store/preferences';
import { Spacing, useTheme } from '@/theme';

export default function SettingsScreen() {
    const { colors } = useTheme();
    const darkMode = usePreferences((s) => s.darkMode);
    const setDarkMode = usePreferences((s) => s.setDarkMode);
    const haptics = usePreferences((s) => s.haptics);
    const setHaptics = usePreferences((s) => s.setHaptics);
    const version = `${Application.nativeApplicationVersion ?? '1.0.0'} (${Application.nativeBuildVersion ?? '1'})`;

    return (
        <Screen>
            <BackHeader title="Settings" />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <Text variant="caption" tone="muted">
                    APPEARANCE
                </Text>
                <Card style={styles.card}>
                    <ListRow
                        icon={<Moon size={18} color={colors.foreground} />}
                        label="Dark mode"
                        trailing={
                            <Switch
                                value={darkMode}
                                onValueChange={setDarkMode}
                                trackColor={{ true: colors.profit, false: colors.input }}
                                accessibilityLabel="Dark mode"
                            />
                        }
                    />
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
});
