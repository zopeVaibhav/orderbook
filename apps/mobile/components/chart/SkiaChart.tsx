import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
    Canvas,
    Circle,
    DashPathEffect,
    Group,
    LinearGradient,
    Path,
    RoundedRect,
    Skia,
    Text as SkiaText,
    useFont,
    vec,
    type SkFont,
} from '@shopify/react-native-skia';
import {
    GestureDetector,
    useExclusiveGestures,
    usePanGesture,
    usePinchGesture,
    useSimultaneousGestures,
    useTapGesture,
} from 'react-native-gesture-handler';
import {
    useAnimatedReaction,
    useDerivedValue,
    useSharedValue,
    withDecay,
    withTiming,
    type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { ArrowRightToLine } from 'lucide-react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import {
    computeFrame,
    formatChartPrice,
    formatChartTime,
    indexAtX,
    maxOffset,
    priceTicks,
    xAt,
    yAt,
    type ChartCandle,
} from '@/lib/chart/worklets';
import { formatPrice, formatSize } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { Spacing, useTheme } from '@/theme';

export type ChartMode = 'line' | 'candles';

interface SkiaChartProps {
    candles: ChartCandle[];
    width: number;
    height: number;
    mode: ChartMode;
    intervalMs: number;
    axes?: boolean;
    reference?: number | null;
    initialSlot?: number;
    latestInset?: { right: number; bottom: number };
}

const AXIS_W = 66;
const TIME_H = 22;
const PAD_Y = 10;
const MIN_Y_SCALE = 0.25;
const MAX_Y_SCALE = 8;
const Y_DRAG_PX = 160;
const MIN_SLOT = 3;
const MAX_SLOT = 28;
const PRICE_SLOTS = [0, 1, 2, 3, 4, 5, 6];
const TIME_SLOTS = [0, 1, 2, 3];
const GEIST = require('@expo-google-fonts/geist/400Regular/Geist_400Regular.ttf');

function PriceLabel({
    index,
    ticks,
    frame,
    plotW,
    plotH,
    font,
    color,
}: {
    index: number;
    ticks: SharedValue<number[]>;
    frame: SharedValue<ReturnType<typeof computeFrame>>;
    plotW: number;
    plotH: number;
    font: SkFont;
    color: string;
}) {
    const text = useDerivedValue(() => {
        const t = ticks.get()[index];
        return t === undefined ? '' : formatChartPrice(t);
    });
    const y = useDerivedValue(() => {
        const t = ticks.get()[index];
        return t === undefined ? -20 : yAt(t, frame.get(), PAD_Y, plotH) + 3.5;
    });
    return <SkiaText x={plotW + 8} y={y} text={text} font={font} color={color} />;
}

function TimeLabel({
    index,
    candles,
    frame,
    plotW,
    slot,
    height,
    font,
    color,
    intervalMs,
}: {
    index: number;
    candles: SharedValue<ChartCandle[]>;
    frame: SharedValue<ReturnType<typeof computeFrame>>;
    plotW: number;
    slot: SharedValue<number>;
    height: number;
    font: SkFont;
    color: string;
    intervalMs: number;
}) {
    const at = useDerivedValue(() => {
        const f = frame.get();
        return Math.round(f.first + ((index + 1) * (f.last - f.first)) / (TIME_SLOTS.length + 1));
    });
    const text = useDerivedValue(() => {
        const c = candles.get()[at.get()];
        return c ? formatChartTime(c.time, intervalMs) : '';
    });
    const x = useDerivedValue(() => {
        const width = font.measureText(text.get()).width;
        return xAt(at.get(), frame.get().endF, plotW, slot.get()) - width / 2;
    });
    return <SkiaText x={x} y={height - 6} text={text} font={font} color={color} />;
}

export function SkiaChart({
    candles,
    width,
    height,
    mode,
    intervalMs,
    axes = false,
    reference = null,
    initialSlot = 8,
    latestInset,
}: SkiaChartProps) {
    const { colors } = useTheme();
    const font = useFont(GEIST, 10);
    const plotW = axes ? width - AXIS_W : width;
    const plotH = axes ? height - TIME_H : height;

    const data = useSharedValue<ChartCandle[]>(candles);
    const offset = useSharedValue(0);
    const slot = useSharedValue(initialSlot);
    const crossX = useSharedValue(-1);
    const yScale = useSharedValue(1);
    const yScaleStart = useSharedValue(1);
    const panStart = useSharedValue(0);
    const pinchStart = useSharedValue(initialSlot);
    const pinchEndF = useSharedValue(0);
    const pinchRel = useSharedValue(0);
    const ref = reference ?? 0;
    const previousLength = useRef(candles.length);
    const [hover, setHover] = useState<number>(-1);
    const [behind, setBehind] = useState(false);
    const [scaled, setScaled] = useState(false);
    const plotClip = Skia.XYWHRect(0, 0, plotW, plotH);

    useEffect(() => {
        const grew = candles.length - previousLength.current;
        previousLength.current = candles.length;
        if (grew > 0 && offset.get() > 0.5) offset.set(offset.get() + grew);
        data.set(candles);
    }, [candles, data, offset]);

    const frame = useDerivedValue(() => {
        const f = computeFrame(data.get(), plotW, slot.get(), offset.get(), ref);
        const k = yScale.get();
        if (k === 1) return f;
        const mid = (f.min + f.max) / 2;
        const half = ((f.max - f.min) / 2) * k;
        return { ...f, min: mid - half, max: mid + half };
    });

    const paths = useDerivedValue(() => {
        const c = data.get();
        const f = frame.get();
        const s = slot.get();
        const upBody = Skia.PathBuilder.Make();
        const downBody = Skia.PathBuilder.Make();
        const upWick = Skia.PathBuilder.Make();
        const downWick = Skia.PathBuilder.Make();
        const line = Skia.PathBuilder.Make();
        const area = Skia.PathBuilder.Make();
        const body = Math.max(1, s * 0.66);
        let started = false;
        let firstX = 0;
        let lastX = 0;
        for (let i = f.first; i <= f.last; i++) {
            const k = c[i];
            if (!k) continue;
            const x = xAt(i, f.endF, plotW, s);
            if (mode === 'candles') {
                const up = k.close >= k.open;
                const top = yAt(Math.max(k.open, k.close), f, PAD_Y, plotH);
                const bottom = yAt(Math.min(k.open, k.close), f, PAD_Y, plotH);
                const wick = up ? upWick : downWick;
                wick.moveTo(x, yAt(k.high, f, PAD_Y, plotH));
                wick.lineTo(x, yAt(k.low, f, PAD_Y, plotH));
                (up ? upBody : downBody).addRect(
                    Skia.XYWHRect(x - body / 2, top, body, Math.max(1, bottom - top)),
                );
            } else {
                const y = yAt(k.close, f, PAD_Y, plotH);
                if (!started) {
                    line.moveTo(x, y);
                    area.moveTo(x, y);
                    firstX = x;
                    started = true;
                } else {
                    line.lineTo(x, y);
                    area.lineTo(x, y);
                }
                lastX = x;
            }
        }
        if (started) {
            area.lineTo(lastX, plotH);
            area.lineTo(firstX, plotH);
            area.close();
        }
        return {
            upBody: upBody.detach(),
            downBody: downBody.detach(),
            upWick: upWick.detach(),
            downWick: downWick.detach(),
            line: line.detach(),
            area: area.detach(),
        };
    });

    const upBody = useDerivedValue(() => paths.get().upBody);
    const downBody = useDerivedValue(() => paths.get().downBody);
    const upWick = useDerivedValue(() => paths.get().upWick);
    const downWick = useDerivedValue(() => paths.get().downWick);
    const line = useDerivedValue(() => paths.get().line);
    const area = useDerivedValue(() => paths.get().area);

    const rising = useDerivedValue(() => {
        const c = data.get();
        const f = frame.get();
        const last = c[f.last];
        const first = c[f.first];
        if (!last || !first) return true;
        return last.close >= (ref > 0 ? ref : first.open);
    });
    const lineColor = useDerivedValue(() => (rising.get() ? colors.profit : colors.loss));
    const fillTop = useDerivedValue(() =>
        rising.get() ? `${colors.profit}40` : `${colors.loss}40`,
    );
    const fillColors = useDerivedValue(() => [fillTop.get(), `${colors.background}00`]);

    const ticks = useDerivedValue(() => {
        const f = frame.get();
        return priceTicks(f.min, f.max, 5);
    });

    const grid = useDerivedValue(() => {
        const p = Skia.PathBuilder.Make();
        if (!axes) return p.detach();
        const f = frame.get();
        for (const t of ticks.get()) {
            const y = yAt(t, f, PAD_Y, plotH);
            p.moveTo(0, y);
            p.lineTo(plotW, y);
        }
        return p.detach();
    });

    const refPath = useDerivedValue(() => {
        const p = Skia.PathBuilder.Make();
        if (ref <= 0 || offset.get() >= 1) return p.detach();
        const y = yAt(ref, frame.get(), PAD_Y, plotH);
        p.moveTo(0, y);
        p.lineTo(plotW, y);
        return p.detach();
    });

    const lastClose = useDerivedValue(() => {
        const c = data.get();
        return c[c.length - 1]?.close ?? 0;
    });
    const lastY = useDerivedValue(() => {
        const y = yAt(lastClose.get(), frame.get(), PAD_Y, plotH);
        return Math.max(PAD_Y, Math.min(plotH - PAD_Y, y));
    });
    const lastPath = useDerivedValue(() => {
        const p = Skia.PathBuilder.Make();
        p.moveTo(0, lastY.get());
        p.lineTo(plotW, lastY.get());
        return p.detach();
    });
    const tagY = useDerivedValue(() => lastY.get() - 9);
    const tagTextY = useDerivedValue(() => lastY.get() + 3.5);
    const tagText = useDerivedValue(() => formatChartPrice(lastClose.get()));

    const hoverIndex = useDerivedValue(() => {
        const x = crossX.get();
        if (x < 0) return -1;
        return indexAtX(x, frame.get(), plotW, slot.get());
    });
    const crossPath = useDerivedValue(() => {
        const p = Skia.PathBuilder.Make();
        const i = hoverIndex.get();
        const k = data.get()[i];
        if (i < 0 || !k) return p.detach();
        const f = frame.get();
        const x = xAt(i, f.endF, plotW, slot.get());
        const y = yAt(k.close, f, PAD_Y, plotH);
        p.moveTo(x, 0);
        p.lineTo(x, plotH);
        p.moveTo(0, y);
        p.lineTo(plotW, y);
        return p.detach();
    });
    const dotX = useDerivedValue(() => {
        const i = hoverIndex.get();
        return i < 0 ? -50 : xAt(i, frame.get().endF, plotW, slot.get());
    });
    const dotY = useDerivedValue(() => {
        const k = data.get()[hoverIndex.get()];
        return k ? yAt(k.close, frame.get(), PAD_Y, plotH) : -50;
    });

    useAnimatedReaction(
        () => hoverIndex.get(),
        (next, prev) => {
            if (next === prev) return;
            scheduleOnRN(setHover, next);
            if (next >= 0) scheduleOnRN(haptic.tap);
        },
    );
    useAnimatedReaction(
        () => offset.get() > 1.5,
        (next, prev) => {
            if (next !== prev) scheduleOnRN(setBehind, next);
        },
    );

    const inspect = usePanGesture({
        activateAfterLongPress: 200,
        onActivate: (e) => {
            'worklet';
            crossX.set(e.x);
        },
        onUpdate: (e) => {
            'worklet';
            crossX.set(e.x);
        },
        onFinalize: () => {
            'worklet';
            crossX.set(-1);
        },
    });

    const scrub = usePanGesture({
        activeOffsetX: [-8, 8],
        failOffsetY: [-12, 12],
        onActivate: () => {
            'worklet';
            panStart.set(offset.get());
        },
        onUpdate: (e) => {
            'worklet';
            const limit = maxOffset(data.get().length, plotW, slot.get());
            offset.set(Math.max(0, Math.min(limit, panStart.get() + e.translationX / slot.get())));
        },
        onDeactivate: (e) => {
            'worklet';
            const limit = maxOffset(data.get().length, plotW, slot.get());
            offset.set(
                withDecay({
                    velocity: e.velocityX / slot.get(),
                    clamp: [0, limit],
                    deceleration: 0.996,
                }),
            );
        },
    });

    const pinch = usePinchGesture({
        onActivate: (e) => {
            'worklet';
            pinchStart.set(slot.get());
            const endF = data.get().length - offset.get();
            pinchEndF.set(endF);
            pinchRel.set((plotW - slot.get() / 2 - e.focalX) / slot.get());
        },
        onUpdate: (e) => {
            'worklet';
            const next = Math.max(MIN_SLOT, Math.min(MAX_SLOT, pinchStart.get() * e.scale));
            const anchor = pinchEndF.get() - 1 - pinchRel.get();
            const rel = (plotW - next / 2 - e.focalX) / next;
            const len = data.get().length;
            const limit = maxOffset(len, plotW, next);
            slot.set(next);
            offset.set(Math.max(0, Math.min(limit, len - (anchor + 1 + rel))));
        },
    });

    const gesture = useSimultaneousGestures(pinch, useExclusiveGestures(inspect, scrub));

    useAnimatedReaction(
        () => Math.abs(yScale.get() - 1) > 0.01,
        (next, prev) => {
            if (next !== prev) scheduleOnRN(setScaled, next);
        },
    );

    const axisDrag = usePanGesture({
        activeOffsetY: [-4, 4],
        onActivate: () => {
            'worklet';
            yScaleStart.set(yScale.get());
        },
        onUpdate: (e) => {
            'worklet';
            const next = yScaleStart.get() * Math.exp(e.translationY / Y_DRAG_PX);
            yScale.set(Math.max(MIN_Y_SCALE, Math.min(MAX_Y_SCALE, next)));
        },
    });

    const axisReset = useTapGesture({
        numberOfTaps: 2,
        onActivate: () => {
            'worklet';
            yScale.set(withTiming(1, { duration: 260 }));
        },
    });

    const axisGesture = useSimultaneousGestures(axisDrag, axisReset);
    const hovered = hover >= 0 ? candles[hover] : undefined;

    return (
        <View style={{ width, height }}>
            <GestureDetector gesture={gesture}>
                <Canvas style={{ width, height }}>
                    <Group clip={plotClip}>
                        <Path path={grid} color={colors.border} style="stroke" strokeWidth={1}>
                            <DashPathEffect intervals={[3, 5]} />
                        </Path>
                        <Path
                            path={refPath}
                            color={colors.mutedForeground}
                            style="stroke"
                            strokeWidth={1}
                            opacity={0.6}
                        >
                            <DashPathEffect intervals={[4, 5]} />
                        </Path>
                        {mode === 'line' ? (
                            <>
                                <Path path={area}>
                                    <LinearGradient
                                        start={vec(0, 0)}
                                        end={vec(0, plotH)}
                                        colors={fillColors}
                                    />
                                </Path>
                                <Path
                                    path={line}
                                    color={lineColor}
                                    style="stroke"
                                    strokeWidth={1.8}
                                    strokeJoin="round"
                                    strokeCap="round"
                                />
                            </>
                        ) : (
                            <>
                                <Path
                                    path={upWick}
                                    color={colors.profit}
                                    style="stroke"
                                    strokeWidth={1}
                                />
                                <Path
                                    path={downWick}
                                    color={colors.loss}
                                    style="stroke"
                                    strokeWidth={1}
                                />
                                <Path path={upBody} color={colors.profit} />
                                <Path path={downBody} color={colors.loss} />
                            </>
                        )}
                        {axes ? (
                            <Path
                                path={lastPath}
                                color={lineColor}
                                style="stroke"
                                strokeWidth={1}
                                opacity={0.9}
                            />
                        ) : null}
                        <Path
                            path={crossPath}
                            color={colors.foreground}
                            style="stroke"
                            strokeWidth={1}
                            opacity={0.55}
                        >
                            <DashPathEffect intervals={[3, 3]} />
                        </Path>
                        <Circle cx={dotX} cy={dotY} r={4} color={colors.foreground} />
                    </Group>
                    {axes && font ? (
                        <>
                            {PRICE_SLOTS.map((i) => (
                                <PriceLabel
                                    key={`p${i}`}
                                    index={i}
                                    ticks={ticks}
                                    frame={frame}
                                    plotW={plotW}
                                    plotH={plotH}
                                    font={font}
                                    color={colors.mutedForeground}
                                />
                            ))}
                            {TIME_SLOTS.map((i) => (
                                <TimeLabel
                                    key={`t${i}`}
                                    index={i}
                                    candles={data}
                                    frame={frame}
                                    plotW={plotW}
                                    slot={slot}
                                    height={height}
                                    font={font}
                                    color={colors.mutedForeground}
                                    intervalMs={intervalMs}
                                />
                            ))}
                            <RoundedRect
                                x={plotW + 2}
                                y={tagY}
                                width={AXIS_W - 4}
                                height={18}
                                r={4}
                                color={lineColor}
                            />
                            <SkiaText
                                x={plotW + 8}
                                y={tagTextY}
                                text={tagText}
                                font={font}
                                color="#ffffff"
                            />
                        </>
                    ) : null}
                </Canvas>
            </GestureDetector>

            {axes ? (
                <GestureDetector gesture={axisGesture}>
                    <View
                        accessibilityLabel="Price axis, drag to scale"
                        style={[styles.axis, { width: AXIS_W, height: plotH }]}
                    />
                </GestureDetector>
            ) : null}

            {axes && scaled ? (
                <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel="Fit prices automatically"
                    feedback="fade"
                    onPress={() => yScale.set(withTiming(1, { duration: 260 }))}
                    style={[
                        styles.auto,
                        {
                            width: AXIS_W - 12,
                            bottom: TIME_H + 6,
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                        },
                    ]}
                >
                    <Text variant="caption">AUTO</Text>
                </PressableScale>
            ) : null}

            {hovered ? <Readout candle={hovered} intervalMs={intervalMs} /> : null}

            {behind ? (
                <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel="Back to latest"
                    feedback="fade"
                    onPress={() => offset.set(withTiming(0, { duration: 420 }))}
                    style={[
                        styles.latest,
                        {
                            right: latestInset?.right ?? (axes ? AXIS_W + 10 : 10),
                            bottom: latestInset?.bottom ?? (axes ? TIME_H + 10 : 10),
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                        },
                    ]}
                >
                    <ArrowRightToLine size={16} color={colors.foreground} />
                </PressableScale>
            ) : null}
        </View>
    );
}

function Readout({ candle, intervalMs }: { candle: ChartCandle; intervalMs: number }) {
    const { colors } = useTheme();
    const up = candle.close >= candle.open;
    const cells: [string, string][] = [
        ['O', formatPrice(candle.open)],
        ['H', formatPrice(candle.high)],
        ['L', formatPrice(candle.low)],
        ['C', formatPrice(candle.close)],
        ['V', formatSize(candle.volume)],
    ];
    return (
        <View pointerEvents="none" style={[styles.readout, { backgroundColor: colors.background }]}>
            <Text variant="caption" tone="muted">
                {formatChartTime(candle.time, intervalMs)}
            </Text>
            {cells.map(([label, value]) => (
                <Text key={label} variant="caption" numeric>
                    <Text variant="caption" tone="muted">
                        {`${label} `}
                    </Text>
                    <Text
                        variant="caption"
                        tone={label === 'C' ? (up ? 'profit' : 'loss') : 'default'}
                    >
                        {value}
                    </Text>
                </Text>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    readout: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        paddingVertical: 2,
    },
    axis: { position: 'absolute', top: 0, right: 0 },
    auto: {
        position: 'absolute',
        right: 6,
        height: 24,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    latest: {
        position: 'absolute',
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
