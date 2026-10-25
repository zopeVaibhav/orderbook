import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useDialog } from '@/store/dialog';
import { Radius, Spacing, useTheme } from '@/theme';
import { Button } from './Button';
import { Text } from './Text';

export function DialogHost() {
    const { colors } = useTheme();
    const current = useDialog((s) => s.current);
    const close = useDialog((s) => s.close);
    const dismiss = () => {
        if (current?.dismissable) close(false);
    };

    return (
        <Modal
            visible={!!current}
            transparent
            animationType="none"
            statusBarTranslucent
            navigationBarTranslucent
            onRequestClose={dismiss}
        >
            {current ? (
                <View style={styles.root}>
                    <Animated.View
                        entering={FadeIn.duration(160)}
                        style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
                    >
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={current.cancelLabel}
                            disabled={!current.dismissable}
                            style={StyleSheet.absoluteFill}
                            onPress={dismiss}
                        />
                    </Animated.View>
                    <Animated.View
                        key={current.id}
                        entering={ZoomIn.duration(180)}
                        accessibilityViewIsModal
                        accessibilityRole="alert"
                        style={[
                            styles.card,
                            { backgroundColor: colors.card, borderColor: colors.border },
                        ]}
                    >
                        <View style={styles.text}>
                            <Text variant="title">{current.title}</Text>
                            {current.message ? <Text tone="muted">{current.message}</Text> : null}
                        </View>
                        <View style={styles.actions}>
                            <Button
                                label={current.cancelLabel ?? 'Cancel'}
                                variant="outline"
                                onPress={() => close(false)}
                                style={styles.action}
                            />
                            <Button
                                label={current.confirmLabel}
                                variant={current.destructive ? 'loss' : 'primary'}
                                onPress={() => close(true)}
                                style={styles.action}
                            />
                        </View>
                    </Animated.View>
                </View>
            ) : null}
        </Modal>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, justifyContent: 'center', padding: Spacing.xl },
    card: {
        borderRadius: Radius['2xl'],
        borderWidth: StyleSheet.hairlineWidth,
        padding: Spacing.xl,
        gap: Spacing.xl,
    },
    text: { gap: Spacing.sm },
    actions: { flexDirection: 'row', gap: Spacing.sm },
    action: { flex: 1 },
});
