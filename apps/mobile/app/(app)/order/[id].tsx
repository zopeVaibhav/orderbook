import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { X } from 'lucide-react-native';
import { OrderKind, Side, TimeInForce } from '@repo/types';
import { LivePrice } from '@/components/market/LivePrice';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { NumberField } from '@/components/ui/NumberField';
import { OrderSheetPlaceholder } from '@/components/ui/Placeholders';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { placeOrderError, useBalances, usePlaceOrder } from '@/hooks/queries/useAccount';
import { useMarket } from '@/hooks/queries/useMarkets';
import { bestPrice } from '@/lib/book';
import { formatPrice, formatSize } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import {
    floorTo,
    minQuantityOf,
    newClientOrderId,
    snapPrice,
    step,
    validatePrice,
    validateQuantity,
} from '@/lib/order';
import { useMarketBook } from '@/store/orderbook';
import { showToast } from '@/store/toast';
import { Radius, Spacing, useTheme } from '@/theme';

const PERCENTS = [25, 50, 75, 100] as const;
const TIFS: { value: TimeInForce; label: string }[] = [
    { value: TimeInForce.GTC, label: 'GTC' },
    { value: TimeInForce.IOC, label: 'IOC' },
    { value: TimeInForce.FOK, label: 'FOK' },
    { value: TimeInForce.POST_ONLY, label: 'Post only' },
];

export default function OrderSheet() {
    const { colors } = useTheme();
    const params = useLocalSearchParams<{ id: string; side?: string }>();
    const market = useMarket(params.id).data;
    const balances = useBalances().data;
    const asks = useMarketBook((s) => s.asks);
    const bids = useMarketBook((s) => s.bids);
    const lastTrade = useMarketBook((s) => s.trades[0]);
    const place = usePlaceOrder();

    const [side, setSide] = useState<Side>(params.side === Side.ASK ? Side.ASK : Side.BID);
    const [kind, setKind] = useState<OrderKind>(OrderKind.LIMIT);
    const [tif, setTif] = useState<TimeInForce>(TimeInForce.GTC);
    const [advanced, setAdvanced] = useState(false);
    const [price, setPrice] = useState<string | null>(null);
    const [quantity, setQuantity] = useState('');
    const [touched, setTouched] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const buy = side === Side.BID;
    const bestAsk = bestPrice(asks, false);
    const bestBid = bestPrice(bids, true);
    const touch = buy ? bestAsk : bestBid;
    const fallback = lastTrade ? parseFloat(lastTrade.price) : (market?.price ?? null);
    const defaultPrice = market ? snapPrice(touch ?? fallback ?? 0, market.tickExp) : '';
    const priceText = price ?? defaultPrice;
    const isLimit = kind === OrderKind.LIMIT;
    const marketBuy = !isLimit && buy;

    const quoteBalance = balances?.find((b) => b.asset === market?.quote);
    const baseBalance = balances?.find((b) => b.asset === market?.base);
    const available = parseFloat((buy ? quoteBalance : baseBalance)?.available ?? '0');
    const execPrice = isLimit ? parseFloat(priceText) : (touch ?? fallback ?? 0);
    const qty = parseFloat(quantity);
    const total = Number.isFinite(qty) && Number.isFinite(execPrice) ? qty * execPrice : 0;

    const errors = useMemo(() => {
        if (!market) return { price: null, quantity: null, funds: null };
        const priceError = isLimit ? validatePrice(market, priceText) : null;
        const quantityError = validateQuantity(market, quantity);
        const need = buy ? total : qty;
        const funds =
            !quantityError && Number.isFinite(need) && need > available
                ? `Not enough ${buy ? market.quote : market.base}`
                : null;
        return { price: priceError, quantity: quantityError, funds };
    }, [market, isLimit, priceText, quantity, buy, total, qty, available]);

    const valid = !errors.price && !errors.quantity && !errors.funds && !marketBuy;

    const fillPercent = (pct: number) => {
        if (!market) return;
        const share = (available * pct) / 100;
        const amount = buy ? (execPrice > 0 ? share / execPrice : 0) : share;
        setQuantity(floorTo(amount, market.lotExp));
        setTouched(true);
    };

    const submit = () => {
        setTouched(true);
        if (!market || !valid) {
            haptic.error();
            return;
        }
        setServerError(null);
        place.mutate(
            {
                marketId: market.id,
                clientOrderId: newClientOrderId(),
                side,
                kind,
                quantity,
                ...(isLimit ? { price: priceText, timeInForce: tif } : {}),
            },
            {
                onSuccess: () => {
                    haptic.success();
                    showToast(`${buy ? 'Buy' : 'Sell'} order placed`, 'success');
                    router.back();
                },
                onError: (error) => {
                    haptic.error();
                    setServerError(placeOrderError(error));
                },
            },
        );
    };

    if (!market) {
        return (
            <View style={[styles.root, { backgroundColor: colors.background }]}>
                <OrderSheetPlaceholder />
            </View>
        );
    }

    const accent = buy ? colors.profit : colors.loss;
    const label = `${buy ? 'Buy' : 'Sell'} ${quantity && !errors.quantity ? `${quantity} ` : ''}${market.base}`;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.root, { backgroundColor: colors.background }]}
        >
            <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                <View style={styles.header}>
                    <View style={styles.flex}>
                        <Text variant="title">
                            {market.base}/{market.quote}
                        </Text>
                        <LivePrice value={fallback} variant="small" />
                    </View>
                    <PressableScale
                        accessibilityRole="button"
                        accessibilityLabel="Close order form"
                        feedback="fade"
                        hitSlop={10}
                        onPress={() => router.back()}
                    >
                        <X size={22} color={colors.foreground} />
                    </PressableScale>
                </View>

                <View style={[styles.segment, { backgroundColor: colors.secondary }]}>
                    {[Side.BID, Side.ASK].map((s) => {
                        const active = s === side;
                        const tone = s === Side.BID ? colors.profit : colors.loss;
                        return (
                            <PressableScale
                                key={s}
                                accessibilityRole="tab"
                                accessibilityState={{ selected: active }}
                                feedback="fade"
                                onPress={() => {
                                    setSide(s);
                                    setPrice(null);
                                    setServerError(null);
                                }}
                                style={[styles.segmentItem, active && { backgroundColor: tone }]}
                            >
                                <Text
                                    variant="bodyMedium"
                                    style={{ color: active ? '#ffffff' : colors.mutedForeground }}
                                >
                                    {s === Side.BID ? 'Buy' : 'Sell'}
                                </Text>
                            </PressableScale>
                        );
                    })}
                </View>

                <View style={styles.row}>
                    <Chip
                        label="Limit"
                        selected={isLimit}
                        onPress={() => setKind(OrderKind.LIMIT)}
                    />
                    <Chip
                        label="Market"
                        selected={!isLimit}
                        onPress={() => setKind(OrderKind.MARKET)}
                    />
                </View>

                {isLimit ? (
                    <NumberField
                        label={`Price (${market.quote})`}
                        unit={market.quote}
                        value={priceText}
                        onChange={(v) => {
                            setPrice(v);
                            setTouched(true);
                        }}
                        onStep={(d) => setPrice(step(priceText, market.tickExp, d))}
                        hint={
                            touch !== null
                                ? `${buy ? 'Best ask' : 'Best bid'} ${formatPrice(touch)}`
                                : undefined
                        }
                        onHint={
                            touch !== null
                                ? () => setPrice(snapPrice(touch, market.tickExp))
                                : undefined
                        }
                        error={touched ? errors.price : null}
                    />
                ) : (
                    <View style={[styles.note, { backgroundColor: colors.secondary }]}>
                        <Text variant="small" tone="muted">
                            {marketBuy
                                ? 'Market buys are not supported yet. Use a limit order at the best ask to fill now.'
                                : `Sells immediately against the best bids${bestBid !== null ? `, now ${formatPrice(bestBid)}` : ''}.`}
                        </Text>
                    </View>
                )}

                <NumberField
                    label={`Quantity (${market.base})`}
                    unit={market.base}
                    value={quantity}
                    onChange={(v) => {
                        setQuantity(v);
                        setTouched(true);
                    }}
                    onStep={(d) => {
                        setQuantity(step(quantity, market.lotExp, d));
                        setTouched(true);
                    }}
                    hint={`Min ${minQuantityOf(market)}`}
                    error={touched ? errors.quantity : null}
                    editable={!marketBuy}
                />

                <View style={styles.row}>
                    {PERCENTS.map((pct) => (
                        <Chip
                            key={pct}
                            label={pct === 100 ? 'Max' : `${pct}%`}
                            onPress={() => fillPercent(pct)}
                        />
                    ))}
                </View>

                {isLimit ? (
                    <View style={styles.advanced}>
                        <PressableScale
                            accessibilityRole="button"
                            feedback="fade"
                            hitSlop={8}
                            onPress={() => setAdvanced((v) => !v)}
                        >
                            <Text variant="smallMedium" tone="muted">
                                {advanced
                                    ? 'Hide advanced'
                                    : `Advanced · ${TIFS.find((t) => t.value === tif)?.label}`}
                            </Text>
                        </PressableScale>
                        {advanced ? (
                            <View style={styles.row}>
                                {TIFS.map((t) => (
                                    <Chip
                                        key={t.value}
                                        label={t.label}
                                        selected={t.value === tif}
                                        onPress={() => setTif(t.value)}
                                    />
                                ))}
                            </View>
                        ) : null}
                    </View>
                ) : null}

                <View style={[styles.summary, { borderColor: colors.border }]}>
                    <View style={styles.summaryRow}>
                        <Text tone="muted">{isLimit ? 'Order value' : 'Estimated value'}</Text>
                        <Text variant="bodyMedium" numeric>
                            {total > 0 ? `${formatPrice(total)} ${market.quote}` : '—'}
                        </Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text tone="muted">Available</Text>
                        <Text variant="bodyMedium" numeric>
                            {buy
                                ? `${formatPrice(available)} ${market.quote}`
                                : `${formatSize(available)} ${market.base}`}
                        </Text>
                    </View>
                </View>

                {touched && errors.funds ? (
                    <Text variant="small" tone="loss">
                        {errors.funds}
                    </Text>
                ) : null}
                {serverError ? (
                    <Text variant="small" tone="loss">
                        {serverError}
                    </Text>
                ) : null}

                <Button
                    label={label}
                    variant={buy ? 'profit' : 'loss'}
                    loading={place.isPending}
                    disabled={marketBuy}
                    onPress={submit}
                    style={{ borderColor: accent }}
                />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing['2xl'] },
    header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    flex: { flex: 1, gap: 2 },
    segment: { flexDirection: 'row', padding: 3, borderRadius: Radius.lg },
    segmentItem: {
        flex: 1,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: Radius.md,
    },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    note: { padding: Spacing.md, borderRadius: Radius.lg },
    advanced: { gap: Spacing.sm },
    summary: {
        gap: Spacing.sm,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
