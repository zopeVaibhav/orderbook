'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCumulativeBook } from '@/hooks/orderbook/useCumulativeBook';
import { useMarket } from '@/hooks/market/useMarkets';
import { formatTime } from '@/lib/format';
import { useTradesStore } from '@/store/market/useTradesStore';
import DepthFooter from './DepthFooter';
import OrderBookRow from './OrderBookRow';

type Tab = 'book' | 'trades';

const DEPTH = 30;
const RECENTER_THRESHOLD_PX = 12;
const MAX_SIZE_DP = 5;

export default function OrderBookPanel() {
    const [active, setActive] = useState<Tab>('book');
    const params = useParams<{ market?: string }>();
    const { data: market } = useMarket(params?.market);
    const { asks, bids, maxTotal, bestAsk, bestBid, buyPct, sellPct } = useCumulativeBook(DEPTH);

    const priceDp = market?.tickExp ?? 2;
    const sizeDp = Math.min(market?.lotExp ?? 4, MAX_SIZE_DP);
    const lastTrade = useTradesStore((s) => s.trades[0]);
    const trades = useTradesStore((s) => s.trades);

    const scrollRef = useRef<HTMLDivElement>(null);
    const spreadRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const takenOverRef = useRef(false);
    const [recenterShown, setRecenterShown] = useState(false);
    const scrollRafRef = useRef(0);

    const hasRows = asks.length > 0 || bids.length > 0;

    const centredScrollTop = useCallback((scroller: HTMLDivElement, spread: HTMLDivElement) => {
        const target = spread.offsetTop - (scroller.clientHeight - spread.offsetHeight) / 2;
        return Math.min(Math.max(target, 0), scroller.scrollHeight - scroller.clientHeight);
    }, []);

    const recenter = useCallback(
        (smooth = true) => {
            const scroller = scrollRef.current;
            const spread = spreadRef.current;
            if (!scroller || !spread) return;
            scroller.scrollTo({
                top: centredScrollTop(scroller, spread),
                behavior: smooth ? 'smooth' : 'auto',
            });
        },
        [centredScrollTop],
    );

    const handleScroll = useCallback(() => {
        if (scrollRafRef.current !== 0) return;
        scrollRafRef.current = requestAnimationFrame(() => {
            scrollRafRef.current = 0;
            const scroller = scrollRef.current;
            const spread = spreadRef.current;
            if (!scroller || !spread) return;
            const distance = Math.abs(scroller.scrollTop - centredScrollTop(scroller, spread));
            setRecenterShown(distance > RECENTER_THRESHOLD_PX);
        });
    }, [centredScrollTop]);

    useLayoutEffect(() => {
        if (active !== 'book') return;
        const scroller = scrollRef.current;
        if (!scroller) return;

        takenOverRef.current = false;
        let raf = 0;
        let tries = 0;

        const settle = () => {
            if (takenOverRef.current) return;
            recenter(false);
            if (++tries < 8) raf = requestAnimationFrame(settle);
        };
        settle();

        const ro = new ResizeObserver(() => {
            if (takenOverRef.current) return;
            recenter(false);
        });
        ro.observe(scroller);

        /** The scroller's own box never changes as levels arrive, only its
         *  content's — so the rows are what has to be watched. */
        if (contentRef.current) ro.observe(contentRef.current);

        return () => {
            cancelAnimationFrame(raf);
            cancelAnimationFrame(scrollRafRef.current);
            scrollRafRef.current = 0;
            ro.disconnect();
        };
    }, [active, hasRows, recenter]);

    const markPrice =
        lastTrade?.price ?? (bestAsk !== null && bestBid !== null ? (bestAsk + bestBid) / 2 : null);
    const markColor = lastTrade?.side === 'ASK' ? 'text-loss' : 'text-profit';

    return (
        <div className="flex w-[320px] shrink-0 flex-col overflow-hidden rounded-md border border-border">
            <Tabs value={active} onValueChange={(v) => setActive(v as Tab)}>
                <TabsList>
                    <TabsTrigger value="book">Order Book</TabsTrigger>
                    <TabsTrigger value="trades">Trades</TabsTrigger>
                </TabsList>
            </Tabs>

            {active === 'book' ? (
                <div className="flex min-h-0 flex-1 flex-col">
                    <div className="grid shrink-0 grid-cols-3 border-b border-border px-2 py-1.5 text-[11px] tracking-wide text-muted-foreground">
                        <div>Price ({market?.quote ?? '—'})</div>
                        <div className="text-right">Size ({market?.symbol ?? '—'})</div>
                        <div className="text-right">Total ({market?.symbol ?? '—'})</div>
                    </div>
                    <div
                        ref={scrollRef}
                        onWheel={() => (takenOverRef.current = true)}
                        onTouchStart={() => (takenOverRef.current = true)}
                        onScroll={handleScroll}
                        className="scrollbar-none relative min-h-0 flex-1 overflow-y-auto [-ms-overflow-style:none] [overflow-anchor:none] [&::-webkit-scrollbar]:hidden"
                    >
                        {asks.length === 0 && bids.length === 0 ? (
                            <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
                                Waiting for orders
                            </div>
                        ) : (
                            <div ref={contentRef} className="flex min-h-full flex-col">
                                <div className="flex flex-1 basis-0 flex-col justify-end">
                                    {asks.map((l, i) => (
                                        <OrderBookRow
                                            key={`a-${i}`}
                                            price={l.price}
                                            size={l.size}
                                            total={l.total}
                                            depthPct={(l.total / maxTotal) * 100}
                                            side="ask"
                                            priceDp={priceDp}
                                            sizeDp={sizeDp}
                                        />
                                    ))}
                                </div>

                                <div
                                    ref={spreadRef}
                                    className="sticky top-0 bottom-0 z-10 flex h-9 items-center justify-between bg-background px-2"
                                >
                                    <div
                                        className={`text-base font-semibold tabular-nums ${markColor}`}
                                    >
                                        {markPrice === null
                                            ? '—'
                                            : markPrice.toLocaleString('en-US', {
                                                  minimumFractionDigits: priceDp,
                                                  maximumFractionDigits: priceDp,
                                              })}
                                    </div>
                                    {}
                                    <span
                                        tabIndex={recenterShown ? 0 : -1}
                                        aria-hidden={!recenterShown}
                                        onClick={() => {
                                            takenOverRef.current = false;
                                            setRecenterShown(false);
                                            recenter();
                                        }}
                                        className={`text-xs cursor-pointer text-sky-500 transition-[opacity,transform] duration-200 ease-out ${
                                            recenterShown
                                                ? 'translate-x-0 opacity-100'
                                                : 'pointer-events-none opacity-0'
                                        }`}
                                    >
                                        Recenter
                                    </span>
                                </div>

                                <div className="flex-1 basis-0">
                                    {bids.map((l, i) => (
                                        <OrderBookRow
                                            key={`b-${i}`}
                                            price={l.price}
                                            size={l.size}
                                            total={l.total}
                                            depthPct={(l.total / maxTotal) * 100}
                                            side="bid"
                                            priceDp={priceDp}
                                            sizeDp={sizeDp}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <DepthFooter buyPct={buyPct} sellPct={sellPct} />
                </div>
            ) : (
                <div className="flex min-h-0 flex-1 flex-col">
                    <div className="grid shrink-0 grid-cols-3 border-b border-border px-2 py-1.5 text-[11px] tracking-wide text-muted-foreground">
                        <div>Price ({market?.quote ?? '—'})</div>
                        <div className="text-right">Qty ({market?.symbol ?? '—'})</div>
                        <div className="text-right">Time</div>
                    </div>
                    <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        {trades.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                Waiting for trades
                            </div>
                        ) : (
                            trades.map((t) => (
                                <div
                                    key={t.id}
                                    className="grid grid-cols-3 px-2 py-0.5 text-xs tabular-nums"
                                >
                                    <span
                                        className={t.side === 'ASK' ? 'text-loss' : 'text-profit'}
                                    >
                                        {t.price.toFixed(priceDp)}
                                    </span>
                                    <span className="text-right text-foreground">
                                        {t.quantity.toFixed(sizeDp)}
                                    </span>
                                    <span className="text-right text-muted-foreground">
                                        {formatTime(t.ts)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
