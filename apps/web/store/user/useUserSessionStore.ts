import { create } from 'zustand';

export interface SessionUser {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    isAdmin?: boolean;
}

interface UserSessionStore {
    user: SessionUser | null;
    accessToken: string | null;
    setSession: (user: SessionUser | null, accessToken: string | null) => void;
}

export const useUserSessionStore = create<UserSessionStore>((set) => ({
    user: null,
    accessToken: null,

    setSession: (user, accessToken) => set({ user, accessToken }),
}));
