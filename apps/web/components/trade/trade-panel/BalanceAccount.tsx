import { ACCOUNT_BALANCE } from '@/data/user-fills';
import { formatUsd } from '@/lib/format';

export default function BalanceAccount() {
    return (
        <div className="flex flex-col gap-2.5 p-3">
            <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">Total Balance</span>
                <span className="text-base font-semibold text-foreground">
                    ${formatUsd(ACCOUNT_BALANCE.total)}
                </span>
            </div>
            <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">Available Balance</span>
                <span className="text-sm text-foreground">
                    ${formatUsd(ACCOUNT_BALANCE.available)}
                </span>
            </div>
        </div>
    );
}
