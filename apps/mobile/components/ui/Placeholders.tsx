import { StyleSheet, View, type DimensionValue } from 'react-native';
import { Radius, Spacing, TypeScale, useTheme, type TypeVariant } from '@/theme';
import { Skeleton } from './Skeleton';

export function Line({ variant, width }: { variant: TypeVariant; width: DimensionValue }) {
    const { fontSize, lineHeight } = TypeScale[variant];
    return (
        <View style={{ height: lineHeight, justifyContent: 'center' }}>
            <Skeleton width={width} height={Math.round(fontSize * 0.78)} radius={Radius.sm} />
        </View>
    );
}

export function Dot({ size }: { size: number }) {
    return <Skeleton width={size} height={size} radius={size / 2} />;
}

function Separator() {
    const { colors } = useTheme();
    return <View style={[styles.separator, { backgroundColor: colors.border }]} />;
}

export function MarketRowPlaceholder({ badge = 34 }: { badge?: number }) {
    return (
        <View style={styles.marketRow}>
            <Dot size={badge} />
            <View style={styles.flexGap}>
                <Line variant="bodyMedium" width={92} />
                <Line variant="small" width={70} />
            </View>
            <View style={styles.endGap}>
                <Line variant="bodyMedium" width={64} />
                <Line variant="smallMedium" width={46} />
            </View>
        </View>
    );
}

export function MarketListPlaceholder({
    count = 6,
    separated = false,
}: {
    count?: number;
    separated?: boolean;
}) {
    return (
        <View>
            {Array.from({ length: count }, (_, i) => (
                <View key={i}>
                    {separated && i > 0 ? <Separator /> : null}
                    <MarketRowPlaceholder />
                </View>
            ))}
        </View>
    );
}

export function TickerPlaceholder() {
    return (
        <View style={styles.tickerRow}>
            {[0, 1, 2].map((i) => (
                <View key={i} style={styles.ticker}>
                    <Line variant="smallMedium" width={28} />
                    <Line variant="small" width={50} />
                    <Skeleton width={54} height={22} radius={Radius.sm} />
                </View>
            ))}
        </View>
    );
}

export function MarketTilePlaceholder() {
    const { colors } = useTheme();
    return (
        <View style={[styles.tile, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Dot size={30} />
            <Line variant="bodyMedium" width="70%" />
            <View style={styles.spacer} />
            <Line variant="bodyMedium" width="45%" />
            <Line variant="small" width="65%" />
        </View>
    );
}

export function HoldingsSummaryPlaceholder() {
    const { colors } = useTheme();
    return (
        <View
            style={[styles.summary, { borderColor: colors.border, backgroundColor: colors.card }]}
        >
            <Line variant="caption" width={86} />
            <Line variant="display" width={170} />
            <View style={[styles.rule, { backgroundColor: colors.border }]} />
            {[0, 1, 2].map((i) => (
                <View key={i} style={styles.between}>
                    <Line variant="body" width={96} />
                    <Line variant="bodyMedium" width={72} />
                </View>
            ))}
        </View>
    );
}

export function HoldingRowPlaceholder() {
    const { colors } = useTheme();
    return (
        <View style={[styles.borderRow, { borderColor: colors.border }]}>
            <Dot size={32} />
            <View style={styles.flexGap}>
                <Line variant="bodyMedium" width={44} />
                <Line variant="small" width={74} />
            </View>
            <View style={styles.endGap}>
                <Line variant="bodyMedium" width={76} />
                <Line variant="small" width={104} />
            </View>
        </View>
    );
}

export function OrderRowPlaceholder() {
    const { colors } = useTheme();
    return (
        <View style={[styles.borderRow, { borderColor: colors.border }]}>
            <Dot size={32} />
            <View style={styles.orderBody}>
                <View style={styles.inline}>
                    <Skeleton width={32} height={18} radius={Radius.sm} />
                    <Line variant="bodyMedium" width={78} />
                </View>
                <Line variant="small" width={128} />
                <Skeleton width="100%" height={3} radius={2} />
            </View>
            <View style={styles.orderEnd}>
                <Line variant="caption" width={42} />
                <Skeleton width={74} height={32} radius={16} />
            </View>
        </View>
    );
}

export function FillRowPlaceholder() {
    return (
        <View style={styles.fillRow}>
            <Dot size={40} />
            <View style={styles.flexGap}>
                <Line variant="bodyMedium" width={140} />
                <Line variant="small" width={112} />
            </View>
            <View style={styles.endGap}>
                <Line variant="smallMedium" width={52} />
                <Line variant="caption" width={40} />
            </View>
        </View>
    );
}

export function FillListPlaceholder({ count = 6 }: { count?: number }) {
    return (
        <View>
            {Array.from({ length: count }, (_, i) => (
                <View key={i}>
                    {i > 0 ? <Separator /> : null}
                    <FillRowPlaceholder />
                </View>
            ))}
        </View>
    );
}

export function BalanceRowPlaceholder() {
    const { colors } = useTheme();
    return (
        <View style={[styles.balanceRow, { borderColor: colors.border }]}>
            <Skeleton width={20} height={20} radius={Radius.sm} />
            <View style={styles.flexGap}>
                <Line variant="heading" width={150} />
                <Line variant="small" width={104} />
            </View>
        </View>
    );
}

function TableHeader() {
    return (
        <View style={styles.tableRow}>
            <Line variant="caption" width={34} />
            <View style={styles.cellEnd}>
                <Line variant="caption" width={28} />
            </View>
            <View style={styles.cellEnd}>
                <Line variant="caption" width={34} />
            </View>
        </View>
    );
}

function TableRow({ widths }: { widths: [number, number, number] }) {
    return (
        <View style={styles.tableRow}>
            <View style={styles.cell}>
                <Line variant="small" width={widths[0]} />
            </View>
            <View style={styles.cellEnd}>
                <Line variant="small" width={widths[1]} />
            </View>
            <View style={styles.cellEnd}>
                <Line variant="small" width={widths[2]} />
            </View>
        </View>
    );
}

const BOOK_WIDTHS: [number, number, number][] = [
    [58, 44, 60],
    [56, 52, 64],
    [58, 38, 56],
    [54, 48, 62],
    [58, 42, 58],
    [56, 50, 66],
];

export function OrderBookPlaceholder() {
    const { colors } = useTheme();
    return (
        <View>
            <TableHeader />
            {BOOK_WIDTHS.map((w, i) => (
                <TableRow key={`a${i}`} widths={w} />
            ))}
            <View style={[styles.mid, { borderColor: colors.border }]}>
                <Line variant="heading" width={86} />
                <View style={styles.spacer} />
                <Line variant="small" width={78} />
            </View>
            {BOOK_WIDTHS.map((w, i) => (
                <TableRow key={`b${i}`} widths={w} />
            ))}
        </View>
    );
}

export function TradeTapePlaceholder({ count = 12 }: { count?: number }) {
    return (
        <View>
            <TableHeader />
            {Array.from({ length: count }, (_, i) => (
                <TableRow key={i} widths={BOOK_WIDTHS[i % BOOK_WIDTHS.length] ?? [56, 44, 60]} />
            ))}
        </View>
    );
}

export function MarketHeaderPlaceholder() {
    return (
        <View style={styles.header}>
            <Dot size={34} />
            <Line variant="heading" width={180} />
            <View style={styles.headerPrice}>
                <Line variant="display" width={150} />
                <Line variant="smallMedium" width={130} />
            </View>
        </View>
    );
}

export function OverviewPlaceholder() {
    return (
        <View style={styles.overview}>
            <Line variant="title" width={124} />
            <View style={styles.range}>
                <View style={styles.between}>
                    <View>
                        <Line variant="small" width={52} />
                        <Line variant="bodyMedium" width={68} />
                    </View>
                    <View style={styles.end}>
                        <Line variant="small" width={56} />
                        <Line variant="bodyMedium" width={68} />
                    </View>
                </View>
                <Skeleton width="100%" height={4} radius={2} />
            </View>
            <View style={styles.statGrid}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <View key={i} style={styles.stat}>
                        <Line variant="small" width={64} />
                        <Line variant="bodyMedium" width={84} />
                    </View>
                ))}
            </View>
        </View>
    );
}

export function OrderSheetPlaceholder() {
    return (
        <View style={styles.sheet}>
            <View style={styles.flexGap}>
                <Line variant="title" width={110} />
                <Line variant="small" width={60} />
            </View>
            <Skeleton width="100%" height={44} radius={Radius.lg} />
            <View style={styles.inline}>
                <Skeleton width={64} height={30} radius={15} />
                <Skeleton width={74} height={30} radius={15} />
            </View>
            <View style={styles.fieldGap}>
                <Line variant="smallMedium" width={96} />
                <Skeleton width="100%" height={48} radius={Radius.lg} />
            </View>
            <View style={styles.fieldGap}>
                <Line variant="smallMedium" width={110} />
                <Skeleton width="100%" height={48} radius={Radius.lg} />
            </View>
            <Skeleton width="100%" height={46} radius={23} />
        </View>
    );
}

export function OrderDetailsPlaceholder() {
    return (
        <View style={styles.details}>
            <View style={styles.detailsHero}>
                <Dot size={52} />
                <Line variant="title" width={150} />
                <Line variant="bodyMedium" width={150} />
                <Line variant="body" width={90} />
            </View>
            <View style={styles.inline}>
                <View style={styles.flexGap}>
                    <Line variant="small" width={90} />
                    <Line variant="heading" width={120} />
                </View>
                <View style={styles.flexGap}>
                    <Line variant="small" width={80} />
                    <Line variant="heading" width={110} />
                </View>
            </View>
            <View style={styles.detailsTimeline}>
                <Line variant="title" width={70} />
                {[0, 1, 2].map((i) => (
                    <View key={i} style={styles.inline}>
                        <Dot size={22} />
                        <View style={styles.flexGap}>
                            <Line variant="bodyMedium" width={140} />
                            <Line variant="small" width={120} />
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    separator: { height: StyleSheet.hairlineWidth },
    details: { padding: Spacing.lg, gap: Spacing['2xl'] },
    detailsHero: { gap: Spacing.sm },
    detailsTimeline: { gap: Spacing.lg },
    marketRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.md,
    },
    flexGap: { flex: 1, gap: 2 },
    endGap: { alignItems: 'flex-end', gap: 2 },
    end: { alignItems: 'flex-end' },
    tickerRow: { flexDirection: 'row', gap: Spacing.xl, paddingHorizontal: Spacing.lg },
    ticker: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    tile: {
        flexBasis: '47%',
        flexGrow: 1,
        minHeight: 128,
        padding: Spacing.md,
        gap: 6,
        borderRadius: Radius.xl,
        borderWidth: StyleSheet.hairlineWidth,
    },
    spacer: { flex: 1 },
    summary: {
        gap: Spacing.md,
        padding: Spacing.xl,
        borderRadius: Radius.xl,
        borderWidth: StyleSheet.hairlineWidth,
    },
    rule: { height: StyleSheet.hairlineWidth, marginVertical: Spacing.xs },
    between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    borderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    orderBody: { flex: 1, gap: 4 },
    orderEnd: { alignItems: 'flex-end', gap: Spacing.sm },
    inline: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    fillRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.md,
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.lg,
        paddingVertical: Spacing.lg,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    tableRow: { flexDirection: 'row', alignItems: 'center', height: 24 },
    cell: { flex: 1 },
    cellEnd: { flex: 1, alignItems: 'flex-end' },
    mid: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        marginVertical: Spacing.xs,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    header: { gap: Spacing.sm },
    headerPrice: { gap: 2, marginBottom: Spacing.md },
    overview: { padding: Spacing.lg, gap: Spacing.xl },
    range: { gap: Spacing.sm, paddingBottom: Spacing.md },
    statGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: Spacing.xl },
    stat: { width: '50%', gap: 2 },
    sheet: { padding: Spacing.lg, gap: Spacing.lg },
    fieldGap: { gap: 6 },
});
