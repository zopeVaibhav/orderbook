'use client';

import { useEffect, useRef, useState } from 'react';
import {
    CandlestickSeries,
    ColorType,
    createChart,
    type BarData,
    type CandlestickData,
    type IChartApi,
    type ISeriesApi,
    type UTCTimestamp,
} from 'lightweight-charts';
import type { Candle, Timeframe } from '@/types/candles';

function resolveColor(raw: string, fallback: string): string {
    if (!raw) return fallback;
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return fallback;

    const sentinel = '#123456';
    ctx.fillStyle = sentinel;
    ctx.fillStyle = raw;
    if (ctx.fillStyle === sentinel && raw.toLowerCase() !== sentinel) return fallback;

    ctx.clearRect(0, 0, 1, 1);
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return a === 255 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${(a! / 255).toFixed(3)})`;
}

function readTheme() {
    const css = getComputedStyle(document.documentElement);
    const read = (name: string, fallback: string) =>
        resolveColor(css.getPropertyValue(name).trim(), fallback);
    return {
        profit: read('--profit', '#009e64'),
        loss: read('--loss', '#ce484b'),
        background: read('--background', '#1a1a1a'),
        border: read('--border', 'rgba(255,255,255,0.1)'),
        muted: read('--muted-foreground', '#a1a1a1'),
    };
}

function formatLocalTime(seconds: number, withSeconds: boolean): string {
    const d = new Date(seconds * 1000);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    if (!withSeconds) return `${hh}:${mm}`;
    return `${hh}:${mm}:${String(d.getSeconds()).padStart(2, '0')}`;
}

type OhlcValues = { open: number; high: number; low: number; close: number };

function formatOhlc(n: number): string {
    return n.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function toSeriesData(candles: Candle[]): CandlestickData<UTCTimestamp>[] {
    return candles.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
    }));
}

export default function CandleChart({
    candles,
    timeframe,
    epoch,
    symbol,
}: {
    candles: Candle[];
    timeframe: Timeframe;
    epoch: number;
    symbol: string;
}) {
    const hostRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const [hovered, setHovered] = useState<OhlcValues | null>(null);
    const candlesRef = useRef(candles);
    const epochRef = useRef(epoch);
    const intervalMsRef = useRef(timeframe.ms);
    intervalMsRef.current = timeframe.ms;

    useEffect(() => {
        candlesRef.current = candles;
    }, [candles]);

    useEffect(() => {
        const host = hostRef.current;
        if (!host) return;

        const theme = readTheme();

        const chart = createChart(host, {
            autoSize: true,
            layout: {
                background: { type: ColorType.Solid, color: theme.background },
                textColor: theme.muted,
                fontSize: 13,
                attributionLogo: false,
            },
            localization: {
                timeFormatter: (t: unknown) => formatLocalTime(t as number, true),
            },
            grid: {
                vertLines: { color: theme.border },
                horzLines: { color: theme.border },
            },
            rightPriceScale: { borderColor: theme.border },
            timeScale: {
                borderColor: theme.border,
                timeVisible: true,
                secondsVisible: timeframe.ms < 60_000,
                tickMarkFormatter: (t: unknown) =>
                    formatLocalTime(t as number, intervalMsRef.current < 60_000),
            },
        });

        const series = chart.addSeries(CandlestickSeries, {
            upColor: theme.profit,
            downColor: theme.loss,
            wickUpColor: theme.profit,
            wickDownColor: theme.loss,
            borderVisible: false,
        });

        series.setData(toSeriesData(candlesRef.current));
        chart.timeScale().fitContent();

        const onCrosshair = (param: { seriesData: Map<unknown, unknown> }) => {
            const bar = param.seriesData.get(series) as BarData<UTCTimestamp> | undefined;
            setHovered(
                bar ? { open: bar.open, high: bar.high, low: bar.low, close: bar.close } : null,
            );
        };
        chart.subscribeCrosshairMove(onCrosshair);

        chartRef.current = chart;
        seriesRef.current = series;

        return () => {
            chart.unsubscribeCrosshairMove(onCrosshair);
            chart.remove();
            chartRef.current = null;
            seriesRef.current = null;
        };
    }, []);

    useEffect(() => {
        const host = hostRef.current;
        if (!host) return;
        const ro = new ResizeObserver(() => {
            if (host.clientWidth > 0) chartRef.current?.timeScale().fitContent();
        });
        ro.observe(host);
        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        const series = seriesRef.current;
        if (!series) return;

        if (epochRef.current !== epoch) {
            epochRef.current = epoch;
            chartRef.current?.applyOptions({
                timeScale: { secondsVisible: timeframe.ms < 60_000 },
            });
            series.setData(toSeriesData(candles));
            chartRef.current?.timeScale().fitContent();
            return;
        }

        const last = candles[candles.length - 1];
        if (!last) return;
        series.update({
            time: last.time as UTCTimestamp,
            open: last.open,
            high: last.high,
            low: last.low,
            close: last.close,
        });
    }, [candles, timeframe, epoch]);

    const latest = candles[candles.length - 1];
    const shown: OhlcValues | undefined = hovered ?? latest;
    const change = shown ? shown.close - shown.open : 0;
    const changePct = shown && shown.open !== 0 ? (change / shown.open) * 100 : 0;
    const changeColor = change >= 0 ? 'text-profit' : 'text-loss';

    return (
        <div className="relative min-h-0 min-w-0 flex-1">
            <div ref={hostRef} className="absolute inset-0" />

            {shown && (
                <div className="pointer-events-none absolute top-2 left-3 z-10 flex flex-col gap-0.5 text-xs tabular-nums">
                    <div className="font-medium text-foreground">
                        {symbol} · {timeframe.key}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                            O
                            <span className={`ml-0.5 ${changeColor}`}>
                                {formatOhlc(shown.open)}
                            </span>
                        </span>
                        <span className="text-muted-foreground">
                            H
                            <span className={`ml-0.5 ${changeColor}`}>
                                {formatOhlc(shown.high)}
                            </span>
                        </span>
                        <span className="text-muted-foreground">
                            L
                            <span className={`ml-0.5 ${changeColor}`}>{formatOhlc(shown.low)}</span>
                        </span>
                        <span className="text-muted-foreground">
                            C
                            <span className={`ml-0.5 ${changeColor}`}>
                                {formatOhlc(shown.close)}
                            </span>
                        </span>
                        <span className={changeColor}>
                            {change >= 0 ? '+' : ''}
                            {change.toFixed(1)} ({changePct >= 0 ? '+' : ''}
                            {changePct.toFixed(2)}%)
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
