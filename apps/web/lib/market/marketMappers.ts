import { marketIcon } from '@/lib/market/marketIcons';
import type { ApiMarket, Market } from '@/types/market';

export function toMarket(m: ApiMarket): Market {
    return {
        id: m.id,
        slug: `${m.base}-${m.quote}`,
        symbol: m.base,
        name: m.baseRef.name,
        quote: m.quote,
        iconSrc: marketIcon(m.base),
        tickExp: m.tickExp,
        lotExp: m.lotExp,
        minQuantity: m.minQuantity,
        baseDecimals: m.baseRef.decimals,
        quoteDecimals: m.quoteRef.decimals,
    };
}
