import * as Haptics from 'expo-haptics';
import { usePreferences } from '@/store/preferences';

function run(effect: () => Promise<void>): void {
    if (!usePreferences.getState().haptics) return;
    effect().catch(() => {});
}

export const haptic = {
    tap: () => run(() => Haptics.selectionAsync()),
    press: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
    success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
    error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
