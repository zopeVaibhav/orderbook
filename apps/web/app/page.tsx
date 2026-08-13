'use client';

import { useUserSessionStore } from '@/store/user/useUserSessionStore';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function Home() {
    const [loading, setLoading] = useState(false);

    const { user } = useUserSessionStore();
    const signInWithGoogle = async () => {
        setLoading(true);
        try {
            await signIn('google', { callbackUrl: '/' });
        } catch (error) {
            console.log('google signin error', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-screen flex flex-col gap-4 items-center justify-center">
            <span className="text-3xl">Orderbook</span>
            {user?.id ? (
                <div>{user.email}</div>
            ) : (
                <button
                    className="border border-white rounded-xl p-2 cursor-pointer"
                    onClick={signInWithGoogle}
                    disabled={loading}
                >
                    {loading ? 'Loading...' : 'Sign In'}
                </button>
            )}
        </div>
    );
}
