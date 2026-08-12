import { AppUser } from '@/app/api/auth/[...nextauth]/options';
declare module 'next-auth' {
    interface Session {
        user?: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
        };
        accessToken?: string;
        error?: string;
    }
}
declare module 'next-auth/jwt' {
    interface JWT {
        user?: AppUser;
        expiresAt?: number;
        error?: string;
    }
}
