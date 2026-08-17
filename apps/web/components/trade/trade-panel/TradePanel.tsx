'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { OrderTypeTab, Side, TimeInForce } from '@/types/order';
import BalanceCard from './BalanceCard';

const TIF_OPTIONS: { key: TimeInForce; label: string }[] = [
    { key: 'gtc', label: 'GTC' },
    { key: 'ioc', label: 'IOC' },
    { key: 'fok', label: 'FOK' },
];

export default function TradePanel() {
    const [side, setSide] = useState<Side>('bid');
    const [orderType, setOrderType] = useState<OrderTypeTab>('limit');
    const [tif, setTif] = useState<TimeInForce>('gtc');
    const [postOnly, setPostOnly] = useState(false);

    const isLimit = orderType === 'limit';

    return (
        <div className="flex w-[320px] shrink-0 flex-col gap-2">
            <div className="flex flex-col overflow-hidden rounded-md border border-border">
                {/* Side: Bid / Ask */}
                <Tabs value={side} onValueChange={(v) => setSide(v as Side)}>
                    <TabsList>
                        <TabsTrigger value="bid" className="data-active:text-profit">
                            Buy
                        </TabsTrigger>
                        <TabsTrigger value="ask" className="data-active:text-loss">
                            Sell
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-3">
                    {/* Order type: Limit / Market */}
                    <div className="flex items-center gap-1">
                        {(['limit', 'market'] as OrderTypeTab[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => setOrderType(t)}
                                className={`cursor-pointer rounded-sm p-2 px-4 text-sm capitalize transition-colors ${
                                    orderType === t
                                        ? 'bg-muted/30 font-semibold text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    <div className="text-sm text-muted-foreground">Available</div>

                    {isLimit && (
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-muted-foreground/60">Price</label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    className="h-10 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                />
                                <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
                                    <div className="flex h-5 aspect-square items-center justify-center rounded-full bg-green-600 text-xs font-semibold text-white">
                                        $
                                    </div>
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground/60">Quantity</label>
                        <div className="relative">
                            <Input
                                type="number"
                                placeholder="0.00"
                                className="h-10 pr-12 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
                                <Image src="/coins/bitcoin.svg" alt="BTC" width={20} height={20} />
                            </span>
                        </div>
                    </div>

                    {isLimit && (
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1">
                                {TIF_OPTIONS.map((t) => (
                                    <button
                                        key={t.key}
                                        disabled={postOnly}
                                        onClick={() => setTif(t.key)}
                                        className={`cursor-pointer rounded px-1.5 py-0.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                                            tif === t.key && !postOnly
                                                ? 'bg-muted font-medium text-foreground'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                                <Checkbox
                                    checked={postOnly}
                                    onCheckedChange={(v) => setPostOnly(!!v)}
                                />
                                Post Only
                            </label>
                        </div>
                    )}

                    <div className="text-sm text-muted-foreground">Order Value</div>

                    {/* Submit */}
                    <button
                        className={`mt-auto cursor-pointer rounded-md py-2 text-sm font-semibold text-background ${
                            side === 'bid' ? 'bg-profit' : 'bg-loss'
                        }`}
                    >
                        {side === 'bid' ? 'Buy' : 'Sell'} BTC
                    </button>
                </div>
            </div>
            <BalanceCard />
        </div>
    );
}
