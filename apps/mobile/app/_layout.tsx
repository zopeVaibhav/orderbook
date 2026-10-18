import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { ConnectivityBanner } from '@/components/ui/ConnectivityBanner';
import { ErrorView } from '@/components/ui/ErrorView';
import { queryClient } from '@/lib/query-client';
import { usePreferences } from '@/store/preferences';
import { useSession } from '@/store/session';
import { FontAssets, useTheme } from '@/theme';

void SplashScreen.preventAutoHideAsync();

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
    return <ErrorView message={error.message} onRetry={retry} />;
}

function RootNavigator() {
    const { colors, isDark } = useTheme();
    const signedIn = useSession((s) => s.status === 'signedIn');
    const hasSeenOnboarding = usePreferences((s) => s.hasSeenOnboarding);

    useEffect(() => {
        void SystemUI.setBackgroundColorAsync(colors.background);
    }, [colors.background]);

    return (
        <>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <Stack
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                    contentStyle: { backgroundColor: colors.background },
                }}
            >
                <Stack.Protected guard={signedIn}>
                    <Stack.Screen name="(app)" />
                </Stack.Protected>
                <Stack.Protected guard={!signedIn && !hasSeenOnboarding}>
                    <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
                </Stack.Protected>
                <Stack.Protected guard={!signedIn && hasSeenOnboarding}>
                    <Stack.Screen name="login" options={{ animation: 'fade' }} />
                </Stack.Protected>
            </Stack>
            <ConnectivityBanner />
        </>
    );
}

export default function RootLayout() {
    const [fontsLoaded, fontError] = useFonts(FontAssets);
    const hydrated = usePreferences((s) => s.hydrated);
    const sessionLoading = useSession((s) => s.status === 'loading');
    const ready = (fontsLoaded || fontError !== null) && hydrated && !sessionLoading;

    useEffect(() => {
        void useSession.getState().hydrate();
    }, []);

    useEffect(() => {
        if (ready) void SplashScreen.hideAsync();
    }, [ready]);

    if (!ready) return null;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <QueryClientProvider client={queryClient}>
                <SafeAreaProvider initialMetrics={initialWindowMetrics}>
                    <RootNavigator />
                </SafeAreaProvider>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}
