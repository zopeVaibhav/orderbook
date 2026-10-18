import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

interface ScreenProps {
    children: ReactNode;
    edges?: Edge[];
    style?: StyleProp<ViewStyle>;
}

export function Screen({ children, edges = ['top'], style }: ScreenProps) {
    const { colors } = useTheme();
    return (
        <SafeAreaView
            edges={edges}
            style={[styles.root, { backgroundColor: colors.background }, style]}
        >
            {children}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
});
