'use client';

import { useParams } from 'next/navigation';
import { Side } from '@repo/types';
import { useMarket } from '@/hooks/market/useMarkets';
import { useFills } from '@/hooks/orders/useFills';
import { formatPrice, formatSize, formatTime, formatUsd } from '@/lib/format';
import { useUserSessionStore } from '@/store/user/useUserSessionStore';
import PanelTable from './PanelTable';

const COLUMNS = 'grid grid-cols-[90px_60px_1fr_1fr_1fr_80px] items-center gap-2 px-3 text-xs';

export default function TradesTab() {
    const signedIn = Boolean(useUserSessionStore((s) => s.accessToken));
    const params = useParams<{ market?: string }>();
    const { data: market } = useMarket(params?.market);
    const { data: fills, isPending } = useFills(market?.id);

    const rows = market ? (fills ?? []) : [];

    let empty: string | null = null;
    if (!signedIn) empty = 'Sign in to see your trades';
    else if (!market) empty = 'Loading';
    else if (rows.length === 0) empty = isPending ? 'Loading' : 'No trades yet';

    return (
        <PanelTable
            columns={COLUMNS}
            empty={empty}
            header={
                <>
                    <span>Time</span>
                    <span>Side</span>
                    <span className="text-right">Price</span>
                    <span className="text-right">Size</span>
                    <span className="text-right">Value</span>
                    <span className="text-right">Role</span>
                </>
            }
        >
            {rows.map((fill) => {
                const price = parseFloat(fill.price);
                const quantity = parseFloat(fill.quantity);

                return (
                    <div
                        key={`${fill.marketId}-${fill.tradeId}`}
                        className={`${COLUMNS} h-8 shrink-0 tabular-nums hover:bg-muted/40`}
                    >
                        <span className="text-muted-foreground">{formatTime(fill.ts)}</span>
                        <span className={fill.side === Side.BID ? 'text-profit' : 'text-loss'}>
                            {fill.side === Side.BID ? 'Buy' : 'Sell'}
                        </span>
                        <span className="text-right text-foreground">${formatPrice(price)}</span>
                        <span className="text-right text-foreground">{formatSize(quantity)}</span>
                        <span className="text-right text-foreground">
                            ${formatUsd(price * quantity)}
                        </span>
                        <span className="text-right text-muted-foreground">
                            {fill.role === 'MAKER' ? 'Maker' : 'Taker'}
                        </span>
                    </div>
                );
            })}
        </PanelTable>
    );
}
