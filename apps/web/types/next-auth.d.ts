import type { SessionUser } from '@/store/user/useUserSessionStore';

declare module 'next-auth' {
    interface Session {
        user?: SessionUser;
        accessToken?: string;
        error?: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        user?: SessionUser;
        accessToken?: string;
        expiresAt?: number;
        error?: string;
    }
}
