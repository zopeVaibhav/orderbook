import { Stack } from 'expo-router';
import { useTheme } from '@/theme';

export default function AppLayout() {
    const { colors } = useTheme();
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: colors.background },
            }}
        >
            <Stack.Screen name="(tabs)" />
        </Stack>
    );
}
