import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'system' | 'light' | 'dark';

interface PreferencesState {
    themeMode: ThemeMode;
    haptics: boolean;
    hasSeenOnboarding: boolean;
    hydrated: boolean;
    setThemeMode: (mode: ThemeMode) => void;
    setHaptics: (enabled: boolean) => void;
    completeOnboarding: () => void;
}

export const usePreferences = create<PreferencesState>()(
    persist(
        (set) => ({
            themeMode: 'system',
            haptics: true,
            hasSeenOnboarding: false,
            hydrated: false,
            setThemeMode: (themeMode) => set({ themeMode }),
            setHaptics: (haptics) => set({ haptics }),
            completeOnboarding: () => set({ hasSeenOnboarding: true }),
        }),
        {
            name: 'orderbook.preferences',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: ({ themeMode, haptics, hasSeenOnboarding }) => ({
                themeMode,
                haptics,
                hasSeenOnboarding,
            }),
            onRehydrateStorage: () => () => usePreferences.setState({ hydrated: true }),
        },
    ),
);
