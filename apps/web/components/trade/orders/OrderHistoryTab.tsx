'use client';

import { OrderKind, OrderStatus, Side } from '@repo/types';
import { useOrders } from '@/hooks/orders/useOrders';
import { formatPrice, formatSize, formatTime } from '@/lib/format';
import { useUserSessionStore } from '@/store/user/useUserSessionStore';
import type { UserOrder } from '@/types/order';
import PanelTable from './PanelTable';

const COLUMNS =
    'grid grid-cols-[90px_110px_60px_70px_1fr_1fr_1fr_140px] items-center gap-2 px-3 text-xs';

const STATUS_LABEL: Record<string, string> = {
    [OrderStatus.FILLED]: 'Filled',
    [OrderStatus.CANCELLED]: 'Cancelled',
    [OrderStatus.REJECTED]: 'Rejected',
};

const STATUS_TONE: Record<string, string> = {
    [OrderStatus.FILLED]: 'text-profit',
    [OrderStatus.CANCELLED]: 'text-muted-foreground',
    [OrderStatus.REJECTED]: 'text-loss',
};

function filledPercent(order: UserOrder): number {
    const quantity = parseFloat(order.quantity);
    if (!quantity) return 0;
    return (parseFloat(order.filledQuantity) / quantity) * 100;
}

export default function OrderHistoryTab() {
    const signedIn = Boolean(useUserSessionStore((s) => s.accessToken));
    const { data: orders, isPending } = useOrders('closed');

    const rows = orders ?? [];

    let empty: string | null = null;
    if (!signedIn) empty = 'Sign in to see your order history';
    else if (rows.length === 0) empty = isPending ? 'Loading' : 'No closed orders';

    return (
        <PanelTable
            columns={COLUMNS}
            empty={empty}
            header={
                <>
                    <span>Time</span>
                    <span>Market</span>
                    <span>Side</span>
                    <span>Type</span>
                    <span className="text-right">Price</span>
                    <span className="text-right">Size</span>
                    <span className="text-right">Filled</span>
                    <span className="text-right">Status</span>
                </>
            }
        >
            {rows.map((order) => (
                <div
                    key={order.clientOrderId}
                    className={`${COLUMNS} h-8 shrink-0 tabular-nums hover:bg-muted/40`}
                >
                    <span className="text-muted-foreground">{formatTime(order.updatedAt)}</span>
                    <span className="text-foreground">
                        {order.base}
                        <span className="text-muted-foreground">/{order.quote}</span>
                    </span>
                    <span className={order.side === Side.BID ? 'text-profit' : 'text-loss'}>
                        {order.side === Side.BID ? 'Buy' : 'Sell'}
                    </span>
                    <span className="text-muted-foreground">
                        {order.kind === OrderKind.LIMIT ? 'Limit' : 'Market'}
                    </span>
                    <span className="text-right text-foreground">
                        {order.price === null
                            ? 'Market'
                            : `$${formatPrice(parseFloat(order.price))}`}
                    </span>
                    <span className="text-right text-foreground">
                        {formatSize(parseFloat(order.quantity))}
                    </span>
                    <span className="text-right text-muted-foreground">
                        {filledPercent(order).toFixed(0)}%
                    </span>
                    <span
                        title={order.rejectReason ?? undefined}
                        className={`truncate text-right ${STATUS_TONE[order.status] ?? 'text-muted-foreground'}`}
                    >
                        {STATUS_LABEL[order.status] ?? order.status}
                        {order.rejectReason && (
                            <span className="text-muted-foreground"> · {order.rejectReason}</span>
                        )}
                    </span>
                </div>
            ))}
        </PanelTable>
    );
}
