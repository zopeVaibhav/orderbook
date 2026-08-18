type Props = {
    buyPct: number;
    sellPct: number;
};

export default function DepthFooter({ buyPct, sellPct }: Props) {
    return (
        <div className="flex h-6 shrink-0 items-stretch border-t border-border text-[11px] font-medium tabular-nums">
            <div
                className="flex items-center justify-start bg-profit/20 pl-2 text-profit transition-[width] duration-500 ease-out"
                style={{ width: `${buyPct}%` }}
            >
                {buyPct}%
            </div>
            <div
                className="flex items-center justify-end bg-loss/20 pr-2 text-loss transition-[width] duration-500 ease-out"
                style={{ width: `${sellPct}%` }}
            >
                {sellPct}%
            </div>
        </div>
    );
}
