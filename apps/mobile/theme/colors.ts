export type Palette = {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    destructive: string;
    border: string;
    input: string;
    ring: string;
    profit: string;
    profitSoft: string;
    loss: string;
    lossSoft: string;
    overlay: string;
};

const profit = '#009e64';
const loss = '#ce484b';

export const Colors: Record<'light' | 'dark', Palette> = {
    light: {
        background: '#ffffff',
        foreground: '#0a0a0a',
        card: '#ffffff',
        cardForeground: '#0a0a0a',
        primary: '#171717',
        primaryForeground: '#fafafa',
        secondary: '#f5f5f5',
        muted: '#f5f5f5',
        mutedForeground: '#737373',
        accent: '#f5f5f5',
        destructive: '#e7000b',
        border: '#e5e5e5',
        input: '#e5e5e5',
        ring: '#a3a3a3',
        profit,
        profitSoft: 'rgba(0, 158, 100, 0.12)',
        loss,
        lossSoft: 'rgba(206, 72, 75, 0.12)',
        overlay: 'rgba(0, 0, 0, 0.5)',
    },
    dark: {
        background: '#1a1a1a',
        foreground: '#fafafa',
        card: '#202020',
        cardForeground: '#fafafa',
        primary: '#e5e5e5',
        primaryForeground: '#202020',
        secondary: '#303030',
        muted: '#303030',
        mutedForeground: '#a3a3a3',
        accent: '#303030',
        destructive: '#ff6467',
        border: 'rgba(255, 255, 255, 0.1)',
        input: 'rgba(255, 255, 255, 0.15)',
        ring: '#737373',
        profit,
        profitSoft: 'rgba(0, 158, 100, 0.16)',
        loss,
        lossSoft: 'rgba(206, 72, 75, 0.16)',
        overlay: 'rgba(0, 0, 0, 0.6)',
    },
};
