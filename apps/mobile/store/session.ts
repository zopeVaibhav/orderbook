import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const SESSION_KEY = 'orderbook.session';

export interface SessionUser {
    id: string;
    email: string;
    name: string;
    image: string | null;
    isAdmin: boolean;
}

interface StoredSession {
    user: SessionUser;
    accessToken: string;
}

type Status = 'loading' | 'signedOut' | 'signedIn';

interface SessionState {
    status: Status;
    user: SessionUser | null;
    accessToken: string | null;
    hydrate: () => Promise<void>;
    setSession: (session: StoredSession) => Promise<void>;
    clear: () => Promise<void>;
}

function parse(raw: string | null): StoredSession | null {
    if (!raw) return null;
    try {
        const value: unknown = JSON.parse(raw);
        if (
            typeof value === 'object' &&
            value !== null &&
            'user' in value &&
            'accessToken' in value &&
            typeof value.accessToken === 'string'
        ) {
            return value as StoredSession;
        }
    } catch {}
    return null;
}

export const useSession = create<SessionState>((set) => ({
    status: 'loading',
    user: null,
    accessToken: null,
    hydrate: async () => {
        const stored = parse(await SecureStore.getItemAsync(SESSION_KEY));
        if (stored) set({ status: 'signedIn', ...stored });
        else set({ status: 'signedOut', user: null, accessToken: null });
    },
    setSession: async (session) => {
        await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
        set({ status: 'signedIn', ...session });
    },
    clear: async () => {
        await SecureStore.deleteItemAsync(SESSION_KEY);
        set({ status: 'signedOut', user: null, accessToken: null });
    },
}));
