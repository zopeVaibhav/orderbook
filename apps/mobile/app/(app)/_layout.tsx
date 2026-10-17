import { Stack } from 'expo-router';
import { useLiveFeed } from '@/hooks/useLiveFeed';
import { Radius, useTheme } from '@/theme';

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
            <Stack.Screen
                name="order/[id]"
                options={{
                    presentation: 'formSheet',
                    sheetAllowedDetents: 'fitToContents',
                    sheetCornerRadius: Radius['2xl'],
                    sheetGrabberVisible: true,
                    contentStyle: { backgroundColor: colors.background },
                }}
            />
            <Stack.Screen name="chart/[id]" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="settings" />
            <Stack.Screen name="activity" />
            <Stack.Screen name="order-details/[id]" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="search" options={{ animation: 'fade' }} />
        </Stack>
    );
}
