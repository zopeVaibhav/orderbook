'use client';

import Image from 'next/image';
import { useParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { AnimatePresence, motion } from 'motion/react';
import { useForm, useWatch, type FieldPath, type PathValue } from 'react-hook-form';
import { OrderKind, Side as ApiSide, TimeInForce as ApiTimeInForce } from '@repo/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMarket } from '@/hooks/market/useMarkets';
import { placeOrderErrorMessage, usePlaceOrder } from '@/hooks/orders/usePlaceOrder';
import { formatUsd } from '@/lib/format';
import { minQuantityOf, stepFor, validatePrice, validateQuantity } from '@/lib/order/orderRules';
import { useUserSessionStore } from '@/store/user/useUserSessionStore';
import type { Market } from '@/types/market';
import type { OrderTypeTab, Side, TimeInForce } from '@/types/order';
import BalanceCard from './BalanceCard';

const TIF_OPTIONS: { key: TimeInForce; label: string }[] = [
    { key: 'gtc', label: 'GTC' },
    { key: 'ioc', label: 'IOC' },
    { key: 'fok', label: 'FOK' },
];

const API_SIDE: Record<Side, ApiSide> = {
    bid: ApiSide.BID,
    ask: ApiSide.ASK,
};

const API_TIF: Record<TimeInForce, ApiTimeInForce> = {
    gtc: ApiTimeInForce.GTC,
    ioc: ApiTimeInForce.IOC,
    fok: ApiTimeInForce.FOK,
};

type OrderForm = {
    side: Side;
    orderType: OrderTypeTab;
    tif: TimeInForce;
    postOnly: boolean;
    price: string;
    quantity: string;
};

export default function TradePanel() {
    const params = useParams<{ market?: string }>();
    const { data: market } = useMarket(params?.market);
    const accessToken = useUserSessionStore((state) => state.accessToken);
    const placeOrder = usePlaceOrder();

    const form = useForm<OrderForm>({
        mode: 'onChange',
        defaultValues: {
            side: 'bid',
            orderType: 'limit',
            tif: 'gtc',
            postOnly: false,
            price: '',
            quantity: '',
        },
    });
    const { register, handleSubmit, setValue, resetField, control, formState } = form;

    const [side, orderType, tif, postOnly, price, quantity] = useWatch({
        control,
        name: ['side', 'orderType', 'tif', 'postOnly', 'price', 'quantity'],
    });

    const isLimit = orderType === 'limit';
    const signedIn = Boolean(accessToken);
    const orderValue = isLimit ? Number(price) * Number(quantity) : NaN;

    const clearResult = () => placeOrder.reset();

    const set = <K extends FieldPath<OrderForm>>(name: K, value: PathValue<OrderForm, K>) => {
        setValue(name, value, { shouldValidate: true });
        clearResult();
    };

    const onSubmit = handleSubmit((values) => {
        if (!market) return;

        placeOrder.mutate(
            {
                marketId: market.id,
                clientOrderId: crypto.randomUUID(),
                side: API_SIDE[values.side],
                kind: values.orderType === 'limit' ? OrderKind.LIMIT : OrderKind.MARKET,
                timeInForce:
                    values.orderType === 'limit'
                        ? values.postOnly
                            ? ApiTimeInForce.POST_ONLY
                            : API_TIF[values.tif]
                        : undefined,
                price: values.orderType === 'limit' ? values.price.trim() : undefined,
                quantity: values.quantity.trim(),
            },
            { onSuccess: () => resetField('quantity') },
        );
    });

    const fieldError = formState.errors.quantity?.message ?? formState.errors.price?.message;
    const status = fieldError
        ? { tone: 'error' as const, text: fieldError }
        : placeOrder.isError
          ? { tone: 'error' as const, text: placeOrderErrorMessage(placeOrder.error) }
          : placeOrder.isSuccess
            ? { tone: 'ok' as const, text: 'Order placed successfully.' }
            : null;

    const requireMarket = (validate: (market: Market, value: string) => string | null) => ({
        required: true,
        validate: (value: string) => {
            if (!market) return 'Market is still loading';
            return validate(market, value) ?? true;
        },
    });

    return (
        <form onSubmit={onSubmit} className="flex w-[320px] shrink-0 flex-col gap-2">
            <div className="flex flex-col overflow-hidden rounded-md border border-border">
                <Tabs value={side} onValueChange={(v) => set('side', v as Side)}>
                    <TabsList>
                        <TabsTrigger value="bid" className="data-active:text-profit">
                            Buy
                        </TabsTrigger>
                        <TabsTrigger value="ask" className="data-active:text-loss">
                            Sell
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-3">
                    <div className="flex items-center gap-1">
                        {(['limit', 'market'] as OrderTypeTab[]).map((t) => (
                            <Button
                                key={t}
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => set('orderType', t)}
                                className={`capitalize ${
                                    orderType === t
                                        ? 'bg-muted/30 font-semibold text-foreground shadow-sm'
                                        : 'text-muted-foreground'
                                }`}
                            >
                                {t}
                            </Button>
                        ))}
                    </div>

                    <div className="text-sm text-muted-foreground">Available</div>

                    {isLimit && (
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-muted-foreground/60">Price</label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    inputMode="decimal"
                                    min={0}
                                    step={market ? stepFor(market.tickExp) : 'any'}
                                    placeholder="0.00"
                                    className="h-10 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                    {...register('price', {
                                        ...requireMarket(validatePrice),
                                        shouldUnregister: true,
                                        onChange: clearResult,
                                    })}
                                />
                                <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
                                    <div className="flex h-5 aspect-square items-center justify-center rounded-full bg-green-600 text-xs font-semibold text-white">
                                        $
                                    </div>
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground/60">Quantity</label>
                        <div className="relative">
                            <Input
                                type="number"
                                inputMode="decimal"
                                min={0}
                                step={market ? stepFor(market.lotExp) : 'any'}
                                placeholder="0.00"
                                className="h-10 pr-12 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                {...register('quantity', {
                                    ...requireMarket(validateQuantity),
                                    onChange: clearResult,
                                })}
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
                                {market?.iconSrc ? (
                                    <Image
                                        src={market.iconSrc}
                                        alt={market.symbol}
                                        width={20}
                                        height={20}
                                    />
                                ) : (
                                    <span className="text-xs text-muted-foreground">
                                        {market?.symbol}
                                    </span>
                                )}
                            </span>
                        </div>
                        {market && (
                            <span className="text-[10px] text-muted-foreground/60">
                                Min {minQuantityOf(market)} {market.symbol}
                            </span>
                        )}
                    </div>

                    {isLimit && (
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1">
                                {TIF_OPTIONS.map((t) => (
                                    <Button
                                        key={t.key}
                                        type="button"
                                        variant="ghost"
                                        size="xs"
                                        disabled={postOnly}
                                        onClick={() => set('tif', t.key)}
                                        className={`${
                                            tif === t.key && !postOnly
                                                ? 'bg-muted font-medium text-foreground'
                                                : 'text-muted-foreground'
                                        }`}
                                    >
                                        {t.label}
                                    </Button>
                                ))}
                            </div>
                            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                                <Checkbox
                                    checked={postOnly}
                                    onCheckedChange={(v) => set('postOnly', !!v)}
                                />
                                Post Only
                            </label>
                        </div>
                    )}

                    <div className="flex items-baseline justify-between text-sm text-muted-foreground">
                        <span>Order Value</span>
                        <span className="text-foreground">
                            {Number.isFinite(orderValue) && orderValue > 0
                                ? `$${formatUsd(orderValue)}`
                                : '—'}
                        </span>
                    </div>

                    <AnimatePresence>
                        {status && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className={`text-xs ${status.tone === 'error' ? 'text-loss' : 'text-profit'}`}
                            >
                                {status.text}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    {signedIn ? (
                        <Button
                            type="submit"
                            size="lg"
                            disabled={!market || !formState.isValid || placeOrder.isPending}
                            className={`mt-auto font-semibold text-foreground ${
                                side === 'bid'
                                    ? 'bg-profit hover:bg-profit'
                                    : 'bg-loss hover:bg-loss'
                            }`}
                        >
                            {placeOrder.isPending
                                ? 'Placing…'
                                : `${side === 'bid' ? 'Buy' : 'Sell'} ${market?.symbol ?? ''}`}
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            size="lg"
                            onClick={() => signIn('google')}
                            className="mt-auto font-semibold"
                        >
                            Sign in to trade
                        </Button>
                    )}
                </div>
            </div>
            <BalanceCard />
        </form>
    );
}
