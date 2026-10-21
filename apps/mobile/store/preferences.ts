import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CandleInterval } from '@repo/types';

const RECENT_LIMIT = 8;
const READ_FILLS_LIMIT = 200;

interface PreferencesState {
    darkMode: boolean;
    haptics: boolean;
    hasSeenOnboarding: boolean;
    notificationsSeenAt: number;
    readFills: string[];
    recentMarkets: string[];
    recentSearches: string[];
    chartMode: 'line' | 'candles';
    chartInterval: CandleInterval;
    hydrated: boolean;
    setDarkMode: (enabled: boolean) => void;
    setHaptics: (enabled: boolean) => void;
    completeOnboarding: () => void;
    markFillRead: (key: string) => void;
    markAllFillsRead: () => void;
    pushRecentMarket: (marketId: string) => void;
    pushRecentSearch: (query: string) => void;
    clearRecentSearches: () => void;
    setChartMode: (mode: 'line' | 'candles') => void;
    setChartInterval: (interval: CandleInterval) => void;
}

export const usePreferences = create<PreferencesState>()(
    persist(
        (set) => ({
            darkMode: true,
            haptics: true,
            hasSeenOnboarding: false,
            notificationsSeenAt: 0,
            readFills: [],
            recentMarkets: [],
            recentSearches: [],
            chartMode: 'candles',
            chartInterval: '1m',
            hydrated: false,
            setDarkMode: (darkMode) => set({ darkMode }),
            setHaptics: (haptics) => set({ haptics }),
            completeOnboarding: () => set({ hasSeenOnboarding: true }),
            markFillRead: (key) =>
                set((s) =>
                    s.readFills.includes(key)
                        ? s
                        : { readFills: [key, ...s.readFills].slice(0, READ_FILLS_LIMIT) },
                ),
            markAllFillsRead: () => set({ notificationsSeenAt: Date.now(), readFills: [] }),
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
            setChartMode: (chartMode) => set({ chartMode }),
            setChartInterval: (chartInterval) => set({ chartInterval }),
        }),
        {
            name: 'orderbook.preferences',
            storage: createJSONStorage(() => AsyncStorage),
            version: 1,
            migrate: (persisted, version) => {
                const state = (persisted ?? {}) as Partial<PreferencesState> & {
                    themeMode?: string;
                };
                if (version < 1) {
                    const { themeMode, ...rest } = state;
                    return { ...rest, darkMode: themeMode !== 'light' } as PreferencesState;
                }
                return state as PreferencesState;
            },
            partialize: ({ hydrated: _hydrated, ...persisted }) => persisted,
            onRehydrateStorage: () => () => usePreferences.setState({ hydrated: true }),
        },
    ),
);
