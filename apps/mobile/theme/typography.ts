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
    display: { fontFamily: Fonts.semibold, fontSize: 32, lineHeight: 38, letterSpacing: -0.8 },
    title: { fontFamily: Fonts.semibold, fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
    heading: { fontFamily: Fonts.semibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
    body: { fontFamily: Fonts.regular, fontSize: 15, lineHeight: 21 },
    bodyMedium: { fontFamily: Fonts.medium, fontSize: 15, lineHeight: 21 },
    small: { fontFamily: Fonts.regular, fontSize: 13, lineHeight: 18 },
    smallMedium: { fontFamily: Fonts.medium, fontSize: 13, lineHeight: 18 },
    caption: { fontFamily: Fonts.medium, fontSize: 11, lineHeight: 14, letterSpacing: 0.3 },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof TypeScale;
