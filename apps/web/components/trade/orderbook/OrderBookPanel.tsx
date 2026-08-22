'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCumulativeBook } from '@/hooks/orderbook/useCumulativeBook';
import { formatTime } from '@/lib/format';
import { useTradesStore } from '@/store/market/useTradesStore';
import DepthFooter from './DepthFooter';
import OrderBookRow from './OrderBookRow';

type Tab = 'book' | 'trades';

const DEPTH = 30;

/** Slack around the centred position before the Recenter button is offered. */
const RECENTER_THRESHOLD_PX = 12;

export default function OrderBookPanel() {
    const [active, setActive] = useState<Tab>('book');
    const { asks, bids, maxTotal, bestAsk, bestBid, buyPct, sellPct } = useCumulativeBook(DEPTH);
    const lastTrade = useTradesStore((s) => s.trades[0]);
    const trades = useTradesStore((s) => s.trades);

    const scrollRef = useRef<HTMLDivElement>(null);
    const spreadRef = useRef<HTMLDivElement>(null);
    const takenOverRef = useRef(false);
    const [recenterShown, setRecenterShown] = useState(false);
    const scrollRafRef = useRef(0);

    /**
     * scrollTop that puts the spread row in the middle of the viewport, clamped
     * to the scrollable range — the browser clamps scrollTo the same way, so an
     * unclamped target would read as permanently off-centre.
     */
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

    // Scroll fires far more often than the screen repaints, and the measurement
    // forces layout, so collapse a burst of events into one read per frame.
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

    // The flex height cascade settles over several frames after mount, so a single
    // measurement lands off-center (or clamps to 0 before the rows have laid out).
    // Re-apply for a few frames, then keep following resizes until the user scrolls.
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

        return () => {
            cancelAnimationFrame(raf);
            cancelAnimationFrame(scrollRafRef.current);
            scrollRafRef.current = 0;
            ro.disconnect();
        };
    }, [active, recenter]);

    // Prefer the last print; fall back to the mid until the first trade lands.
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
                        <div>Price (USD)</div>
                        <div className="text-right">Size (BTC)</div>
                        <div className="text-right">Total (BTC)</div>
                    </div>
                    <div
                        ref={scrollRef}
                        onWheel={() => (takenOverRef.current = true)}
                        onTouchStart={() => (takenOverRef.current = true)}
                        onScroll={handleScroll}
                        className="scrollbar-none relative min-h-0 flex-1 overflow-y-auto [-ms-overflow-style:none] [overflow-anchor:none] [&::-webkit-scrollbar]:hidden"
                    >
                        {asks.map((l, i) => (
                            <OrderBookRow
                                key={`a-${i}`}
                                price={l.price}
                                size={l.size}
                                total={l.total}
                                depthPct={(l.total / maxTotal) * 100}
                                side="ask"
                            />
                        ))}

                        <div
                            ref={spreadRef}
                            className="sticky top-0 bottom-0 z-10 flex h-9 items-center justify-between bg-background px-2"
                        >
                            <div className={`text-base font-semibold tabular-nums ${markColor}`}>
                                {markPrice === null
                                    ? '—'
                                    : markPrice.toLocaleString('en-US', {
                                          minimumFractionDigits: 1,
                                          maximumFractionDigits: 1,
                                      })}
                            </div>
                            {/* Kept mounted and faded instead of unmounted, so the
                                spread row never changes height mid-scroll. */}
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

                        {bids.map((l, i) => (
                            <OrderBookRow
                                key={`b-${i}`}
                                price={l.price}
                                size={l.size}
                                total={l.total}
                                depthPct={(l.total / maxTotal) * 100}
                                side="bid"
                            />
                        ))}
                    </div>

                    <DepthFooter buyPct={buyPct} sellPct={sellPct} />
                </div>
            ) : (
                <div className="flex min-h-0 flex-1 flex-col">
                    <div className="grid shrink-0 grid-cols-3 border-b border-border px-2 py-1.5 text-[11px] tracking-wide text-muted-foreground">
                        <div>Price (USD)</div>
                        <div className="text-right">Qty (BTC)</div>
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
                                        {t.price.toFixed(1)}
                                    </span>
                                    <span className="text-right text-foreground">
                                        {t.quantity.toFixed(5)}
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
