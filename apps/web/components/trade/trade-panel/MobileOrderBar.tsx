'use client';

import { Button } from '@/components/ui/button';
import { useOrderEntryStore } from '@/store/market/useOrderEntryStore';

export default function MobileOrderBar() {
    const openSheet = useOrderEntryStore((s) => s.openSheet);

    return (
        <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-border bg-background px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] lg:hidden">
            <Button
                size="lg"
                onClick={() => openSheet('bid')}
                className="h-11 flex-1 bg-profit font-semibold text-foreground hover:bg-profit"
            >
                Buy
            </Button>
            <Button
                size="lg"
                onClick={() => openSheet('ask')}
                className="h-11 flex-1 bg-loss font-semibold text-foreground hover:bg-loss"
            >
                Sell
            </Button>
        </div>
    );
}
