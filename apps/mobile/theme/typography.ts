import {
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
} from '@expo-google-fonts/geist';
import type { TextStyle } from 'react-native';

export const FontAssets = {
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
};

export const Fonts = {
    regular: 'Geist_400Regular',
    medium: 'Geist_500Medium',
    semibold: 'Geist_600SemiBold',
    bold: 'Geist_700Bold',
} as const;

export const TypeScale = {
    display: { fontFamily: Fonts.semibold, fontSize: 26, lineHeight: 32, letterSpacing: -0.6 },
    title: { fontFamily: Fonts.semibold, fontSize: 18, lineHeight: 23, letterSpacing: -0.3 },
    heading: { fontFamily: Fonts.semibold, fontSize: 15.5, lineHeight: 20, letterSpacing: -0.1 },
    body: { fontFamily: Fonts.regular, fontSize: 14, lineHeight: 20 },
    bodyMedium: { fontFamily: Fonts.medium, fontSize: 14, lineHeight: 20 },
    small: { fontFamily: Fonts.regular, fontSize: 12, lineHeight: 16 },
    smallMedium: { fontFamily: Fonts.medium, fontSize: 12, lineHeight: 16 },
    caption: { fontFamily: Fonts.medium, fontSize: 10, lineHeight: 13, letterSpacing: 0.4 },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof TypeScale;
