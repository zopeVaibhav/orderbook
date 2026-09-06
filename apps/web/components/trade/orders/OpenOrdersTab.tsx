'use client';

import { OrderKind, OrderStatus, Side } from '@repo/types';
import { Button } from '@/components/ui/button';
import { cancelOrderErrorMessage, useCancelOrder, useOrders } from '@/hooks/orders/useOrders';
import { formatPrice, formatSize, formatTime } from '@/lib/format';
import { useUserSessionStore } from '@/store/user/useUserSessionStore';
import type { UserOrder } from '@/types/order';

const COLUMNS =
    'grid grid-cols-[90px_110px_60px_70px_1fr_1fr_1fr_80px] items-center gap-2 px-3 text-xs';

const STATUS_LABEL: Record<string, string> = {
    [OrderStatus.PENDING]: 'Pending',
    [OrderStatus.RESTED]: 'Resting',
    [OrderStatus.PARTIAL]: 'Partial',
};

function filledPercent(order: UserOrder): number {
    const quantity = parseFloat(order.quantity);
    if (!quantity) return 0;
    return (parseFloat(order.filledQuantity) / quantity) * 100;
}

export default function OpenOrdersTab() {
    const signedIn = Boolean(useUserSessionStore((s) => s.accessToken));
    const { data: orders, isPending } = useOrders('open');
    const cancel = useCancelOrder();

    const rows = orders ?? [];

    if (!signedIn) {
        return <EmptyMessage>Sign in to see your open orders</EmptyMessage>;
    }

    if (rows.length === 0) {
        return <EmptyMessage>{isPending ? 'Loading' : 'No open orders'}</EmptyMessage>;
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            {cancel.isError && (
                <div className="px-3 pt-2 text-xs text-destructive">
                    {cancelOrderErrorMessage(cancel.error)}
                </div>
            )}
            <div
                className={`${COLUMNS} border-b border-border py-2 uppercase tracking-wide text-muted-foreground/70`}
            >
                <span>Time</span>
                <span>Market</span>
                <span>Side</span>
                <span>Type</span>
                <span className="text-right">Price</span>
                <span className="text-right">Size</span>
                <span className="text-right">Filled</span>
                <span className="text-right">Status</span>
            </div>
            <div className="scrollbar-none flex min-h-0 flex-1 flex-col overflow-y-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {rows.map((order) => {
                    const cancelling = cancel.isPending && cancel.variables === order.clientOrderId;

                    return (
                        <div
                            key={order.clientOrderId}
                            className={`${COLUMNS} group py-1.5 tabular-nums hover:bg-muted/40`}
                        >
                            <span className="text-muted-foreground">
                                {formatTime(order.createdAt)}
                            </span>
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
                            <div className="flex justify-end">
                                <span className="text-muted-foreground group-hover:hidden">
                                    {STATUS_LABEL[order.status] ?? order.status}
                                </span>
                                <Button
                                    size="xs"
                                    variant="destructive"
                                    disabled={cancelling}
                                    onClick={() => cancel.mutate(order.clientOrderId)}
                                    className="hidden group-hover:inline-flex"
                                >
                                    {cancelling ? 'Cancelling' : 'Cancel'}
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function EmptyMessage({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            {children}
        </div>
    );
}
