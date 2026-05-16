import { AppUser } from '@/app/api/auth/[...nextauth]/options';

declare module 'next-auth' {
    interface Session {
        user: AppUser;
        expiresAt: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        user: AppUser;
    }
}
