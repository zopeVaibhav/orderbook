import { SIGNIN_URL } from '@/lib/api-routes';
import axios from 'axios';
import { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export interface AppUser {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    token?: string | null;
}

export const authOptions: AuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: '/',
    },

    callbacks: {
        async signIn({ user, account }) {
            try {
                if (!account) return false;
                const response = await axios.post(SIGNIN_URL, { ...account, ...user });

                const result = response.data;

                if (result?.status) {
                    const u = user as AppUser;
                    u.id = result.data.user.id;
                    u.token = result.data.token;
                    return true;
                }
                return false;
            } catch (error) {
                console.log('signIn callback error', error);
                return false;
            }
        },

        async jwt({ user, token }) {
            if (user) {
                token.user = user as AppUser;
            }
            return token;
        },

        async session({ session, token }) {
            session.user = token.user as AppUser;
            return session;
        },
    },

    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    prompt: 'consent',
                    access_type: 'offline',
                    response_type: 'code',
                    scope: 'email openid profile',
                },
            },
        }),
    ],
};
