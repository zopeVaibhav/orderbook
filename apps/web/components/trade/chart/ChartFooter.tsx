export default function ChartFooter() {
    const timeframes = ['1d', '1w', '1m', '3m', '6m', '1y', '5y'];
    return (
        <div className="flex h-9 shrink-0 items-center gap-3 border-t border-border px-3 text-sm">
            <div>
                {timeframes.map((t) => (
                    <span className="p-2" key={t}>
                        {t}
                    </span>
                ))}
            </div>
            <div className="ml-auto">UTC</div>
        </div>
    );
}
