import ChartCanvas from './ChartCanvas';
import ChartFooter from './ChartFooter';
import MarketHeader from './MarketHeader';

export default function ChartPanel({ onToggleMarkets }: { onToggleMarkets: () => void }) {
    return (
        <div className="flex h-[420px] min-w-0 flex-none flex-col rounded-md border border-border md:h-auto md:flex-1">
            <MarketHeader onToggleMarkets={onToggleMarkets} />
            <ChartCanvas />
            <ChartFooter />
        </div>
    );
}
