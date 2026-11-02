import { useState, type ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    FadeInRight,
    useAnimatedStyle,
    withTiming,
} from 'react-native-reanimated';
import { ArrowLeftRight, BookOpen, Wallet, type LucideProps } from 'lucide-react-native';
import { DepthArt } from '@/components/brand/DepthArt';
import { Button } from '@/components/ui/Button';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { usePreferences } from '@/store/preferences';
import { Spacing, useTheme } from '@/theme';

interface Step {
    icon: ComponentType<LucideProps>;
    title: string;
    body: string;
}

const STEPS: Step[] = [
    {
        icon: BookOpen,
        title: 'See the whole book',
        body: 'Bids and asks stack up in real time, so you know where the price can actually go before you trade.',
    },
    {
        icon: ArrowLeftRight,
        title: 'Orders that really match',
        body: 'Limit and market orders go to a matching engine. Fills land in your history the moment they happen.',
    },
    {
        icon: Wallet,
        title: 'Start with 5,000 USDC',
        body: 'Sign in once and a paper balance is waiting. Learn the book without risking anything real.',
    },
];

function Dot({ active }: { active: boolean }) {
    const { colors } = useTheme();
    const animated = useAnimatedStyle(() => ({
        width: withTiming(active ? 22 : 6, { duration: 260 }),
        opacity: withTiming(active ? 1 : 0.35, { duration: 260 }),
    }));
    return <Animated.View style={[styles.dot, { backgroundColor: colors.foreground }, animated]} />;
}

export default function OnboardingScreen() {
    const { colors } = useTheme();
    const completeOnboarding = usePreferences((s) => s.completeOnboarding);
    const [index, setIndex] = useState(0);
    const step = STEPS[index] ?? STEPS[0]!;
    const last = index === STEPS.length - 1;
    const Icon = step.icon;

    return (
        <Screen edges={['top', 'bottom']} style={styles.root}>
            <View style={styles.header}>
                <View style={styles.dots}>
                    {STEPS.map((s, i) => (
                        <Dot key={s.title} active={i === index} />
                    ))}
                </View>
                {!last ? (
                    <PressableScale
                        accessibilityRole="button"
                        hitSlop={12}
                        onPress={completeOnboarding}
                    >
                        <Text variant="smallMedium" tone="muted">
                            Skip
                        </Text>
                    </PressableScale>
                ) : null}
            </View>

            <View style={styles.art}>
                {index === 0 ? (
                    <DepthArt />
                ) : (
                    <Animated.View
                        key={`icon-${index}`}
                        entering={FadeIn.duration(320)}
                        style={[styles.iconRing, { borderColor: colors.border }]}
                    >
                        <View style={[styles.iconCore, { backgroundColor: colors.secondary }]}>
                            <Icon size={40} color={colors.foreground} strokeWidth={1.6} />
                        </View>
                    </Animated.View>
                )}
            </View>

            <Animated.View
                key={`copy-${index}`}
                entering={FadeInRight.duration(320)}
                exiting={FadeOut.duration(120)}
                style={styles.copy}
            >
                <Text variant="display">{step.title}</Text>
                <Text tone="muted">{step.body}</Text>
            </Animated.View>

            <Button
                label={last ? 'Get started' : 'Next'}
                onPress={() => (last ? completeOnboarding() : setIndex(index + 1))}
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    root: { paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing.md },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
    },
    dots: { flexDirection: 'row', gap: 6 },
    dot: { height: 6, borderRadius: 3 },
    art: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    iconRing: {
        width: 180,
        height: 180,
        borderRadius: 90,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCore: {
        width: 112,
        height: 112,
        borderRadius: 56,
        alignItems: 'center',
        justifyContent: 'center',
    },
    copy: { gap: Spacing.md, minHeight: 180 },
});
