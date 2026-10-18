import type { ComponentType } from 'react';
import { StyleSheet, View, type ColorValue } from 'react-native';
import type { LucideProps } from 'lucide-react-native';
import { Radius, useTheme } from '@/theme';

interface TabIconProps {
    icon: ComponentType<LucideProps>;
    focused: boolean;
    color: ColorValue;
}

export function TabIcon({ icon: Icon, focused, color }: TabIconProps) {
    const { colors } = useTheme();
    return (
        <View style={[styles.pill, focused && { backgroundColor: colors.secondary }]}>
            <Icon
                size={21}
                color={typeof color === 'string' ? color : colors.foreground}
                strokeWidth={focused ? 2.2 : 1.8}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    pill: {
        width: 48,
        height: 30,
        borderRadius: Radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
