import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

interface IconButtonProps {
    icon: ReactNode;
    label: string;
    onPress?: () => void;
    badge?: number;
}

export function IconButton({ icon, label, onPress, badge }: IconButtonProps) {
    const { colors } = useTheme();
    return (
        <PressableScale
            accessibilityRole="button"
            accessibilityLabel={label}
            hitSlop={8}
            onPress={onPress}
            scaleTo={0.9}
            style={[styles.button, { backgroundColor: colors.secondary }]}
        >
            {icon}
            {badge ? (
                <View style={[styles.badge, { backgroundColor: colors.loss }]}>
                    <Text variant="caption" style={styles.badgeText}>
                        {badge > 9 ? '9+' : badge}
                    </Text>
                </View>
            ) : null}
        </PressableScale>
    );
}

const styles = StyleSheet.create({
    button: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: -2,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        paddingHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: { color: '#ffffff', fontSize: 10, lineHeight: 12 },
});
