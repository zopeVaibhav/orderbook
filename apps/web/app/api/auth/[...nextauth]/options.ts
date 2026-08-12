import { SIGNIN_URL } from '@/lib/api-routes';
import axios from 'axios';
import { AuthOptions, User } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const SESSION_MAX_AGE_SEC = 7 * 24 * 60 * 60;

export interface AppUser extends User {
    expiresIn: number;
    accessToken: string;
}

interface SignInResponse {
    status: boolean;
    data: { user: AppUser };
}

export const authOptions: AuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: '/',
    },
    session: {
        strategy: 'jwt',
        maxAge: SESSION_MAX_AGE_SEC,
    },

    callbacks: {
        async signIn({ user, account }) {
            try {
                if (!account || !account.id_token) return false;
                const response = await axios.post<SignInResponse>(SIGNIN_URL, {
                    idToken: account.id_token,
                });
                const result = response.data;
                if (result.status) {
                    Object.assign(user, result.data.user);
                    return true;
                }
                console.error('[signIn] backend rejected sign in', result);
                return false;
            } catch (error) {
                console.error('[signIn]', error);
                return false;
            }
        },

        async jwt({ user, token }) {
            if (user) {
                const u = user as AppUser;
                token.user = u;
                token.expiresAt = Date.now() + u.expiresIn * 1000;
                token.error = undefined;
                return token;
            }

            if (token.expiresAt && Date.now() >= token.expiresAt) {
                return { ...token, error: 'SessionExpired' };
            }

            return token;
        },

        async session({ session, token }) {
            const user = token.user;
            if (!user) return session;

            session.user = {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
            };
            session.accessToken = token.error ? undefined : user.accessToken;
            session.error = token.error;
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
