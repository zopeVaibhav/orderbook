'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMarkets } from '@/hooks/market/useMarkets';
import { formatPrice } from '@/lib/format';
import type { Market } from '@/types/market';

export default function Searchbar() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const { data: markets, isPending } = useMarkets();

    const results = useMemo(() => {
        const all = markets ?? [];
        const q = query.trim().toLowerCase();
        const base = q
            ? all.filter(
                  (m) => m.symbol.toLowerCase().includes(q) || m.name.toLowerCase().includes(q),
              )
            : all;
        return base.slice(0, 8);
    }, [markets, query]);

    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === '/') {
                e.preventDefault();
                inputRef.current?.focus();
                setOpen(true);
            }
            if (e.key === 'Escape') {
                setOpen(false);
                inputRef.current?.blur();
            }
        }
        document.addEventListener('mousedown', onDocClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDocClick);
            document.removeEventListener('keydown', onKey);
        };
    }, []);

    function go(m: Market) {
        router.push(`/trade/${m.slug}`);
        setOpen(false);
        setQuery('');
        inputRef.current?.blur();
    }

    function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && results[active]) {
            e.preventDefault();
            go(results[active]);
        }
    }

    return (
        <div ref={wrapperRef} className="relative w-full max-w-md">
            <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setOpen(true)}
                    onKeyDown={onInputKey}
                    placeholder="Search markets"
                    className="h-9 rounded-md bg-muted/40 pr-14 pl-9 placeholder:text-muted-foreground/70"
                />
                <kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    /
                </kbd>
            </div>

            {open && (
                <div className="absolute top-full right-0 left-0 z-50 mt-1.5 overflow-hidden rounded-md border border-border bg-popover shadow-lg">
                    <div className="border-b border-border px-3 py-1.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                        {query ? 'Results' : 'Trending'}
                    </div>
                    <div className="scrollbar-none max-h-80 overflow-y-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        {isPending ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                Loading markets…
                            </div>
                        ) : results.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                No markets match &ldquo;{query}&rdquo;
                            </div>
                        ) : (
                            results.map((m, i) => {
                                const positive = (m.change24h ?? 0) >= 0;
                                return (
                                    <Button
                                        key={m.id}
                                        variant="ghost"
                                        onMouseEnter={() => setActive(i)}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            go(m);
                                        }}
                                        className={`h-auto border-none w-full justify-start gap-3 rounded-none px-3 py-2 text-left ${
                                            i === active ? 'bg-muted' : ''
                                        }`}
                                    >
                                        {m.iconSrc ? (
                                            <Image
                                                src={m.iconSrc}
                                                alt={m.symbol}
                                                width={20}
                                                height={20}
                                            />
                                        ) : (
                                            <div className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                                                {m.symbol.slice(0, 1)}
                                            </div>
                                        )}
                                        <div className="flex min-w-0 flex-1 flex-col leading-tight">
                                            <span className="truncate text-sm font-medium text-foreground">
                                                {m.symbol}
                                            </span>
                                            <span className="truncate text-xs text-muted-foreground">
                                                {m.name}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end leading-tight">
                                            <span className="text-sm text-foreground">
                                                {m.price === undefined
                                                    ? '—'
                                                    : `$${formatPrice(m.price)}`}
                                            </span>
                                            <span
                                                className={`text-xs ${positive ? 'text-profit' : 'text-loss'}`}
                                            >
                                                {m.change24h === undefined
                                                    ? '—'
                                                    : `${positive ? '+' : ''}${m.change24h.toFixed(2)}%`}
                                            </span>
                                        </div>
                                    </Button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
