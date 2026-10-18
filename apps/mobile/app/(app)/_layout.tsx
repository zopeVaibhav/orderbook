import { Stack } from 'expo-router';
import { useLiveFeed } from '@/hooks/useLiveFeed';
import { useTheme } from '@/theme';

export default function AppLayout() {
    const { colors } = useTheme();
    useLiveFeed();
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: colors.background },
            }}
        >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="market/[id]" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="search" options={{ animation: 'fade' }} />
        </Stack>
    );
}
