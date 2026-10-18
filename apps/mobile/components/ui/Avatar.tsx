import { Image, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme';
import { Text } from './Text';

export function Avatar({
    name,
    image,
    size = 40,
}: {
    name: string;
    image: string | null;
    size?: number;
}) {
    const { colors } = useTheme();
    const radius = { width: size, height: size, borderRadius: size / 2 };
    if (image)
        return <Image source={{ uri: image }} style={radius} accessibilityIgnoresInvertColors />;
    return (
        <View style={[styles.fallback, radius, { backgroundColor: colors.secondary }]}>
            <Text variant="bodyMedium" style={{ fontSize: size * 0.4 }}>
                {name.trim().charAt(0).toUpperCase() || '?'}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    fallback: { alignItems: 'center', justifyContent: 'center' },
});
