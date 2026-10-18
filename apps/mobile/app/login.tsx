import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Activity, Gift, Zap } from 'lucide-react-native';
import { DepthArt } from '@/components/brand/DepthArt';
import { GoogleMark } from '@/components/brand/GoogleMark';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { describeAuthError, signInWithGoogle } from '@/lib/auth';
import { haptic } from '@/lib/haptics';
import { Spacing, useTheme } from '@/theme';

const VALUE_PROPS = [
    { icon: Activity, title: 'Live order book', body: 'Every bid and ask, streamed as it moves' },
    { icon: Zap, title: 'Real matching', body: 'Orders fill against a real engine' },
    { icon: Gift, title: '5,000 USDC to start', body: 'Credited the first time you sign in' },
] as const;

export default function LoginScreen() {
    const { colors } = useTheme();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onContinue = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await signInWithGoogle();
            if (result === 'success') haptic.success();
        } catch (e) {
            haptic.error();
            setError(describeAuthError(e));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Screen edges={['top', 'bottom']} style={styles.root}>
            <View style={styles.brand}>
                <View style={[styles.dot, { backgroundColor: colors.profit }]} />
                <Text variant="heading">Orderbook</Text>
            </View>

            <View style={styles.hero}>
                <DepthArt />
                <Animated.View entering={FadeInDown.delay(150).duration(450)} style={styles.copy}>
                    <Text variant="display">Trade on a live order book.</Text>
                    <Text tone="muted">
                        Spot markets, real fills, balances that settle as you trade.
                    </Text>
                </Animated.View>
                <View style={styles.props}>
                    {VALUE_PROPS.map(({ icon: Icon, title, body }, i) => (
                        <Animated.View
                            key={title}
                            entering={FadeInDown.delay(260 + i * 80).duration(420)}
                            style={styles.prop}
                        >
                            <View style={[styles.propIcon, { backgroundColor: colors.secondary }]}>
                                <Icon size={16} color={colors.foreground} />
                            </View>
                            <View style={styles.propText}>
                                <Text variant="bodyMedium">{title}</Text>
                                <Text variant="small" tone="muted">
                                    {body}
                                </Text>
                            </View>
                        </Animated.View>
                    ))}
                </View>
            </View>

            <View style={styles.footer}>
                {error ? (
                    <Text variant="small" tone="destructive" style={styles.center}>
                        {error}
                    </Text>
                ) : null}
                <Button
                    label="Continue with Google"
                    variant="outline"
                    icon={<GoogleMark />}
                    loading={loading}
                    onPress={onContinue}
                />
                <Text variant="caption" tone="muted" style={styles.center}>
                    Paper balances only. No real money moves.
                </Text>
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    root: { paddingHorizontal: Spacing['2xl'] },
    brand: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingTop: Spacing.md },
    dot: { width: 8, height: 8, borderRadius: 4 },
    hero: { flex: 1, justifyContent: 'center', gap: Spacing['2xl'] },
    copy: { gap: Spacing.sm },
    props: { gap: Spacing.lg },
    prop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    propIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    propText: { flex: 1 },
    footer: { gap: Spacing.md, paddingBottom: Spacing.md },
    center: { textAlign: 'center' },
});
