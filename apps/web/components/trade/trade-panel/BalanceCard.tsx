import BalanceAccount from './BalanceAccount';
import RecentFills from './RecentFills';

export default function BalanceCard() {
    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-border">
            <BalanceAccount />
            <div className="border-t border-border" />
            <RecentFills />
        </div>
    );
}
