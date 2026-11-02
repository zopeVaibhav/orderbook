import { useEffect, useRef } from 'react';
import {
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme';

const CLEAR = 'rgba(0, 0, 0, 0)';
const FADE_MS = 700;

export function usePriceFlash(value: number | null) {
    const { colors } = useTheme();
    const previous = useRef(value);
    const tint = useSharedValue(0);

    useEffect(() => {
        const before = previous.current;
        previous.current = value;
        if (value === null || before === null || value === before) return;
        const direction = value > before ? 1 : -1;
        tint.set(
            withSequence(
                withTiming(direction, { duration: 0 }),
                withTiming(0, { duration: FADE_MS }),
            ),
        );
    }, [value, tint]);

    const up = colors.profitSoft;
    const down = colors.lossSoft;

    return useAnimatedStyle(() => {
        const t = tint.get();
        return {
            backgroundColor:
                t >= 0
                    ? interpolateColor(t, [0, 1], [CLEAR, up])
                    : interpolateColor(t, [-1, 0], [down, CLEAR]),
        };
    });
}
