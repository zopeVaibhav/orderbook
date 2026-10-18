import * as Haptics from 'expo-haptics';
import { usePreferences } from '@/store/preferences';

function enabled(): boolean {
    return usePreferences.getState().haptics;
}

export const haptic = {
    tap: () => {
        if (enabled()) void Haptics.selectionAsync();
    },
    press: () => {
        if (enabled()) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    success: () => {
        if (enabled()) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    error: () => {
        if (enabled()) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
};
