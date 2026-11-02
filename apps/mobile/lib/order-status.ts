import { OrderKind, OrderStatus, TimeInForce } from '@repo/types';

export type StatusState = 'done' | 'failed' | 'open';

export function statusState(status: OrderStatus): StatusState {
    if (status === OrderStatus.FILLED) return 'done';
    if (status === OrderStatus.CANCELLED || status === OrderStatus.REJECTED) return 'failed';
    return 'open';
}

export function statusLabel(status: OrderStatus): string {
    switch (status) {
        case OrderStatus.PENDING:
            return 'Pending';
        case OrderStatus.RESTED:
            return 'Open';
        case OrderStatus.PARTIAL:
            return 'Partially filled';
        case OrderStatus.FILLED:
            return 'Filled';
        case OrderStatus.CANCELLED:
            return 'Cancelled';
        default:
            return 'Rejected';
    }
}

export function kindLabel(kind: OrderKind): string {
    return kind === OrderKind.LIMIT ? 'Limit' : 'Market';
}

export function tifLabel(tif: TimeInForce | null): string {
    switch (tif) {
        case TimeInForce.GTC:
            return 'Good till cancelled';
        case TimeInForce.IOC:
            return 'Immediate or cancel';
        case TimeInForce.FOK:
            return 'Fill or kill';
        case TimeInForce.POST_ONLY:
            return 'Post only';
        default:
            return '—';
    }
}
