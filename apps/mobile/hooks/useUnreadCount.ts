import { useFills } from '@/hooks/queries/useAccount';
import { usePreferences } from '@/store/preferences';

export function useUnreadCount(): number {
    const { data } = useFills();
    const seenAt = usePreferences((s) => s.notificationsSeenAt);
    return (data ?? []).filter((fill) => fill.ts > seenAt).length;
}
