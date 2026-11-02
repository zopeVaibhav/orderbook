import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { Spacing } from '@/theme';

export function SheetLayout({
    header,
    footer,
    children,
}: {
    header?: ReactNode;
    footer?: ReactNode;
    children: ReactNode;
}) {
    const insets = useSafeAreaInsets();
    const { height: windowHeight } = useWindowDimensions();
    const keyboardHeight = useKeyboardHeight();
    const open = keyboardHeight > 0;
    const maxHeight = open ? windowHeight - keyboardHeight - insets.top - Spacing.sm : undefined;
    const bottom = open ? Spacing.md : insets.bottom + Spacing.md;

    return (
        <View style={{ maxHeight }}>
            {header}
            <ScrollView
                style={styles.body}
                contentContainerStyle={footer ? styles.content : { paddingBottom: bottom }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {children}
            </ScrollView>
            {footer ? (
                <View style={[styles.footer, { paddingBottom: bottom }]}>{footer}</View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    body: { flexGrow: 0, flexShrink: 1 },
    content: { paddingBottom: Spacing.md },
    footer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
});
