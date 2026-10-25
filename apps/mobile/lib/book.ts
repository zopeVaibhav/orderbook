export function bestPrice(side: Map<string, string>, highest: boolean): number | null {
    let result: number | null = null;
    for (const price of side.keys()) {
        const p = parseFloat(price);
        if (result === null || (highest ? p > result : p < result)) result = p;
    }
    return result;
}
