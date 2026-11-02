import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useBodyHeight } from './CollapsingScreen';

const TAP_SLIDE = { duration: 280, easing: Easing.out(Easing.cubic) };
const SETTLE = { damping: 26, stiffness: 260, mass: 0.9 };
const EDGE_RESISTANCE = 0.3;
const FLING_VELOCITY = 600;
const SWITCH_FRACTION = 0.28;

interface SwipePagerProps {
    index: number;
    onIndexChange: (index: number) => void;
    pages: ReactNode[];
    progress: SharedValue<number>;
}

export function SwipePager({ index, onIndexChange, pages, progress }: SwipePagerProps) {
    const count = pages.length;
    const minHeight = useBodyHeight();
    const [width, setWidth] = useState(0);
    const [heights, setHeights] = useState<number[]>([]);
    const [visited, setVisited] = useState<Set<number>>(() => new Set([index]));
    const offset = progress;
    const dragStart = useSharedValue(index);
    const pageWidth = useSharedValue(0);

    if (!visited.has(index)) setVisited(new Set(visited).add(index));

    useEffect(() => {
        pageWidth.set(width);
    }, [width, pageWidth]);

    useEffect(() => {
        if (Math.round(offset.get()) !== index) offset.set(withTiming(index, TAP_SLIDE));
    }, [index, offset]);

    const pan = usePanGesture({
        activeOffsetX: [-12, 12],
        failOffsetY: [-10, 10],
        onActivate: () => {
            'worklet';
            dragStart.set(offset.get());
        },
        onUpdate: (e) => {
            'worklet';
            const w = pageWidth.get();
            if (w === 0) return;
            let next = dragStart.get() - e.translationX / w;
            if (next < 0) next *= EDGE_RESISTANCE;
            if (next > count - 1) next = count - 1 + (next - (count - 1)) * EDGE_RESISTANCE;
            offset.set(next);
        },
        onDeactivate: (e) => {
            'worklet';
            const start = Math.round(dragStart.get());
            const moved = offset.get() - start;
            let target = start;
            if (e.velocityX < -FLING_VELOCITY || moved > SWITCH_FRACTION) target = start + 1;
            else if (e.velocityX > FLING_VELOCITY || moved < -SWITCH_FRACTION) target = start - 1;
            target = Math.max(0, Math.min(count - 1, target));
            offset.set(withSpring(target, SETTLE));
            if (target !== start) scheduleOnRN(onIndexChange, target);
        },
    });

    const track = useAnimatedStyle(() => ({
        transform: [{ translateX: -offset.get() * pageWidth.get() }],
    }));

    const activeHeight = Math.max(heights[index] ?? 0, minHeight);

    return (
        <GestureDetector gesture={pan}>
            <View
                onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
                style={[styles.viewport, activeHeight ? { height: activeHeight } : null]}
            >
                <Animated.View style={[styles.track, { width: width * count }, track]}>
                    {pages.map((page, i) => (
                        <View
                            key={i}
                            style={{ width, minHeight }}
                            onLayout={(e) => {
                                const h = e.nativeEvent.layout.height;
                                setHeights((prev) => {
                                    if (prev[i] === h) return prev;
                                    const next = [...prev];
                                    next[i] = h;
                                    return next;
                                });
                            }}
                        >
                            {visited.has(i) ? page : null}
                        </View>
                    ))}
                </Animated.View>
            </View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    viewport: { overflow: 'hidden' },
    track: { flexDirection: 'row', alignItems: 'flex-start' },
});
