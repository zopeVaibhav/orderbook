import axios, { isAxiosError } from 'axios';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import type { ApiResponse } from '@repo/types';
import { useSession, type SessionUser } from '@/store/session';
import { API_URL, SIGNIN_URL } from './api-routes';
import { ENV } from './env';
import { queryClient } from './query-client';

interface SignInPayload extends SessionUser {
    accessToken: string;
    expiresIn: number;
}

GoogleSignin.configure({
    webClientId: ENV.googleWebClientId,
    iosClientId: ENV.googleIosClientId || undefined,
});

async function exchange(idToken: string): Promise<void> {
    const { data } = await axios.post<ApiResponse<SignInPayload>>(
        `${API_URL}${SIGNIN_URL}`,
        { idToken },
        { timeout: 15_000 },
    );
    const { accessToken, id, email, name, image, isAdmin } = data.data;
    await useSession.getState().setSession({
        accessToken,
        user: { id, email, name, image, isAdmin },
    });
}

export async function signInWithGoogle(): Promise<'success' | 'cancelled'> {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return 'cancelled';
    const { idToken } = response.data;
    if (!idToken) throw new Error('Google returned no ID token. Check the web client ID.');
    await exchange(idToken);
    return 'success';
}

export async function refreshSession(): Promise<boolean> {
    try {
        const response = await GoogleSignin.signInSilently();
        if (response.type !== 'success' || !response.data.idToken) return false;
        await exchange(response.data.idToken);
        return true;
    } catch {
        return false;
    }
}

export async function signOut(): Promise<void> {
    try {
        await GoogleSignin.signOut();
    } catch {}
    await useSession.getState().clear();
    queryClient.clear();
}

export function describeAuthError(error: unknown): string {
    if (isAxiosError(error)) {
        if (!error.response) return 'Could not reach the server. Check your connection.';
        if (error.response.status === 401) return 'The server rejected this Google account.';
        return 'Sign in failed on the server. Try again in a moment.';
    }
    if (error instanceof Error) return error.message;
    return 'Sign in failed. Please try again.';
}
