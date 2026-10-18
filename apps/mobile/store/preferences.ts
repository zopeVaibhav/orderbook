import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'system' | 'light' | 'dark';

interface PreferencesState {
    themeMode: ThemeMode;
    haptics: boolean;
    hasSeenOnboarding: boolean;
    notificationsSeenAt: number;
    hydrated: boolean;
    setThemeMode: (mode: ThemeMode) => void;
    setHaptics: (enabled: boolean) => void;
    completeOnboarding: () => void;
    markNotificationsSeen: () => void;
}

export const usePreferences = create<PreferencesState>()(
    persist(
        (set) => ({
            themeMode: 'system',
            haptics: true,
            hasSeenOnboarding: false,
            notificationsSeenAt: 0,
            hydrated: false,
            setThemeMode: (themeMode) => set({ themeMode }),
            setHaptics: (haptics) => set({ haptics }),
            completeOnboarding: () => set({ hasSeenOnboarding: true }),
            markNotificationsSeen: () => set({ notificationsSeenAt: Date.now() }),
        }),
        {
            name: 'orderbook.preferences',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: ({ themeMode, haptics, hasSeenOnboarding, notificationsSeenAt }) => ({
                themeMode,
                haptics,
                hasSeenOnboarding,
                notificationsSeenAt,
            }),
            onRehydrateStorage: () => () => usePreferences.setState({ hydrated: true }),
        },
    ),
);
