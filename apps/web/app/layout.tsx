import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/providers/AuthProvider';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'Orderbook',
    description:
        'Trade spot markets on a real-time limit order book. Place orders, watch fills as they happen, and track balances across every market.',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={`${geistSans.variable} ${geistMono.variable} dark scheme-dark h-full antialiased`}
        >
            <body className="min-h-full flex flex-col">
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
