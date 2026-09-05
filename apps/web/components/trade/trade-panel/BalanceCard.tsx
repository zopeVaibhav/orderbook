import type { Side } from '@/types/order';
import BalanceAccount from './BalanceAccount';
import RecentFills from './RecentFills';

export default function BalanceCard({ side }: { side: Side }) {
    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-border">
            <BalanceAccount side={side} />
            <div className="border-t border-border" />
            <RecentFills />
        </div>
    );
}
