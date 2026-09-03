import { availableOf, totalOf, useBalance } from '@/hooks/balance/useGetBalances';
import { useMarket } from '@/hooks/market/useMarkets';
import { formatUsd } from '@/lib/format';
import { useParams } from 'next/navigation';

export default function BalanceAccount() {
    const param = useParams<{ market?: string }>();
    const { data: market } = useMarket(param.market);
    const { data: balance } = useBalance(market?.quote);

    return (
        <div className="flex flex-col gap-2.5 p-3">
            <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">Total Balance</span>
                <span className="text-base font-semibold text-foreground">
                    ${formatUsd(totalOf(balance))}
                </span>
            </div>
            <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">Available Balance</span>
                <span className="text-sm text-foreground">${formatUsd(availableOf(balance))}</span>
            </div>
        </div>
    );
}
