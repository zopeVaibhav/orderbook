import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const RECENT_LIMIT = 8;

export type ThemeMode = 'system' | 'light' | 'dark';

interface PreferencesState {
    themeMode: ThemeMode;
    haptics: boolean;
    hasSeenOnboarding: boolean;
    notificationsSeenAt: number;
    recentMarkets: string[];
    recentSearches: string[];
    hydrated: boolean;
    setThemeMode: (mode: ThemeMode) => void;
    setHaptics: (enabled: boolean) => void;
    completeOnboarding: () => void;
    markNotificationsSeen: () => void;
    pushRecentMarket: (marketId: string) => void;
    pushRecentSearch: (query: string) => void;
    clearRecentSearches: () => void;
}

export const usePreferences = create<PreferencesState>()(
    persist(
        (set) => ({
            themeMode: 'system',
            haptics: true,
            hasSeenOnboarding: false,
            notificationsSeenAt: 0,
            recentMarkets: [],
            recentSearches: [],
            hydrated: false,
            setThemeMode: (themeMode) => set({ themeMode }),
            setHaptics: (haptics) => set({ haptics }),
            completeOnboarding: () => set({ hasSeenOnboarding: true }),
            markNotificationsSeen: () => set({ notificationsSeenAt: Date.now() }),
            pushRecentMarket: (marketId) =>
                set((s) => ({
                    recentMarkets: [
                        marketId,
                        ...s.recentMarkets.filter((id) => id !== marketId),
                    ].slice(0, RECENT_LIMIT),
                })),
            pushRecentSearch: (query) =>
                set((s) => ({
                    recentSearches: [
                        query,
                        ...s.recentSearches.filter((q) => q.toLowerCase() !== query.toLowerCase()),
                    ].slice(0, RECENT_LIMIT),
                })),
            clearRecentSearches: () => set({ recentSearches: [] }),
        }),
        {
            name: 'orderbook.preferences',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: ({ hydrated: _hydrated, ...persisted }) => persisted,
            onRehydrateStorage: () => () => usePreferences.setState({ hydrated: true }),
        },
    ),
);
