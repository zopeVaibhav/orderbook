import type { ApiResponse } from '@repo/types';
import type { OrderKind, Side, TimeInForce } from '@repo/types';
import { apiClient } from '@/lib/axios';
import { ORDERS_URL } from '@/lib/api-routes';

export type PlaceOrderInput = {
    marketId: string;
    clientOrderId: string;
    side: Side;
    kind: OrderKind;
    timeInForce?: TimeInForce;
    price?: string;
    quantity: string;
};

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderInput> {
    const { data } = await apiClient.post<ApiResponse<PlaceOrderInput>>(ORDERS_URL, input);
    return data.data;
}
