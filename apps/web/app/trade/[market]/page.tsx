import Navbar from '@/components/nav/Navbar';
import StatusBar from '@/components/trade/StatusBar';
import TradeShell from '@/components/trade/TradeShell';

export default function Page() {
    return (
        <div className="flex min-h-dvh w-full flex-col bg-background pb-[calc(3.75rem+env(safe-area-inset-bottom))] text-foreground lg:h-dvh lg:pb-0">
            <Navbar location="trade" />
            <TradeShell />
            <StatusBar />
        </div>
    );
}
