import type { UserFill } from '@repo/types';
import { useFills } from '@/hooks/queries/useAccount';
import { usePreferences } from '@/store/preferences';

export function fillKey(fill: UserFill): string {
    return `${fill.tradeId}-${fill.clientOrderId}`;
}

export function useIsFillUnread(): (fill: UserFill) => boolean {
    const seenAt = usePreferences((s) => s.notificationsSeenAt);
    const readFills = usePreferences((s) => s.readFills);
    return (fill) => fill.ts > seenAt && !readFills.includes(fillKey(fill));
}

export function useUnreadCount(): number {
    const { data } = useFills();
    const isUnread = useIsFillUnread();
    return (data ?? []).filter(isUnread).length;
}
