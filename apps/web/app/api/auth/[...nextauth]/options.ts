import { SIGNIN_URL } from '@/lib/api-routes';
import type { ApiResponse } from '@repo/types';
import axios from 'axios';
import { AuthOptions, User } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const SESSION_MAX_AGE_SEC = 7 * 24 * 60 * 60;

export interface SignInData {
    id: string;
    name: string;
    email: string;
    image: string | null;
    accessToken: string;
    expiresIn: number;
}

function expiryFrom(expiresIn: number | undefined): number | undefined {
    if (typeof expiresIn !== 'number' || !Number.isFinite(expiresIn)) return undefined;
    return Date.now() + expiresIn * 1000;
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
                if (!account?.id_token) return false;

                const response = await axios.post<ApiResponse<SignInData>>(SIGNIN_URL, {
                    idToken: account.id_token,
                });
                const result = response.data;

                if (!result.status || !result.data) {
                    console.error('[signIn] backend rejected sign in', result.error);
                    return false;
                }

                Object.assign(user, result.data);
                return true;
            } catch (error) {
                console.error('[signIn]', error);
                return false;
            }
        },

        async jwt({ user, token }) {
            if (user) {
                const signedIn = user as User & Partial<SignInData>;
                const expiresAt = expiryFrom(signedIn.expiresIn);

                if (!signedIn.accessToken || !expiresAt) {
                    console.error('[jwt] sign in payload missing accessToken/expiresIn');
                    return { ...token, error: 'SessionExpired' };
                }

                return {
                    ...token,
                    user: {
                        id: signedIn.id,
                        name: signedIn.name,
                        email: signedIn.email,
                        image: signedIn.image,
                    },
                    accessToken: signedIn.accessToken,
                    expiresAt,
                    error: undefined,
                };
            }

            if (token.error) return token;
            if (!token.expiresAt || Date.now() >= token.expiresAt) {
                return { ...token, error: 'SessionExpired' };
            }

            return token;
        },

        async session({ session, token }) {
            session.user = token.user;
            session.accessToken = token.error ? undefined : token.accessToken;
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
                    access_type: 'offline',
                    response_type: 'code',
                    scope: 'email openid profile',
                },
            },
        }),
    ],
};
