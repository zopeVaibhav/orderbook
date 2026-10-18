import { useColorScheme } from 'react-native';
import { usePreferences } from '@/store/preferences';
import { Colors, type Palette } from './colors';

export { Colors, type Palette } from './colors';
export { Fonts, FontAssets, TypeScale, type TypeVariant } from './typography';

export const Radius = {
    sm: 6,
    md: 8,
    lg: 10,
    xl: 14,
    '2xl': 18,
    full: 9999,
} as const;

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
} as const;

export type Scheme = 'light' | 'dark';

export function useScheme(): Scheme {
    const system = useColorScheme();
    const mode = usePreferences((s) => s.themeMode);
    if (mode === 'system') return system === 'dark' ? 'dark' : 'light';
    return mode;
}

export function useTheme(): { colors: Palette; scheme: Scheme; isDark: boolean } {
    const scheme = useScheme();
    return { colors: Colors[scheme], scheme, isDark: scheme === 'dark' };
}
