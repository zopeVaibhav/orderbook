import Navbar from '@/components/nav/Navbar';
import StatusBar from '@/components/trade/StatusBar';
import TradeShell from '@/components/trade/TradeShell';

export default function Page() {
    return (
        <div className="flex h-screen w-full flex-col bg-background text-foreground">
            <Navbar />
            <TradeShell />
            <StatusBar />
        </div>
    );
}
