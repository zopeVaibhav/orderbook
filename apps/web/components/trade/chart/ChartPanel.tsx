import ChartCanvas from './ChartCanvas';
import ChartFooter from './ChartFooter';
import MarketHeader from './MarketHeader';

export default function ChartPanel({ onToggleMarkets }: { onToggleMarkets: () => void }) {
    return (
        <div className="flex min-w-0 flex-1 flex-col rounded-md border border-border">
            <MarketHeader onToggleMarkets={onToggleMarkets} />
            <ChartCanvas />
            <ChartFooter />
        </div>
    );
}
