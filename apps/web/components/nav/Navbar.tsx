'use client';

import { signIn } from 'next-auth/react';
import Searchbar from '../searchbar/Searchbar';
import { Button } from '@/components/ui/button';
import { useUserSessionStore } from '@/store/user/useUserSessionStore';
import Image from 'next/image';
import Link from 'next/link';

type NavbarProps = {
    location: 'home' | 'trade';
};

export default function Navbar({ location }: NavbarProps) {
    const user = useUserSessionStore((state) => state.user);
    return (
        <div className="flex h-14 shrink-0 items-center justify-between gap-4 px-3">
            <Link href="/" className="text-lg font-semibold">
                Orderbook
            </Link>

            {location === 'trade' && (
                <div className="flex flex-1 justify-center">
                    <Searchbar />
                </div>
            )}
            {user ? (
                <div>
                    <Image
                        src={`https://api.dicebear.com/10.x/critters/svg?seed=${encodeURIComponent(user.email ?? user.name ?? 'user')}`}
                        alt={user.name ?? ''}
                        width={30}
                        height={30}
                        unoptimized
                        className="rounded-full cursor-pointer"
                    />
                </div>
            ) : (
                <Button onClick={() => signIn('google', { callbackUrl: '/' })} className="shrink-0">
                    Login
                </Button>
            )}
        </div>
    );
}
