const DECIMAL = /^\d+(\.\d+)?$/;

export function scale(value: string, exp: number): bigint | null {
    const trimmed = value.trim();
    if (!DECIMAL.test(trimmed)) return null;

    const [whole, fraction = ''] = trimmed.split('.');
    if (fraction.length > exp) return null;

    return BigInt(whole + fraction.padEnd(exp, '0'));
}

export function unscale(value: bigint | string, exp: number): string {
    const negative = value.toString().startsWith('-');
    const digits = value
        .toString()
        .replace('-', '')
        .padStart(exp + 1, '0');
    const sign = negative ? '-' : '';

    if (exp === 0) return sign + digits;

    const whole = digits.slice(0, digits.length - exp);
    const fraction = digits.slice(digits.length - exp).replace(/0+$/, '');

    return fraction ? `${sign}${whole}.${fraction}` : sign + whole;
}

export function stepFor(exp: number): string {
    return exp <= 0 ? '1' : `0.${'0'.repeat(exp - 1)}1`;
}

export function isJsonSafe(...values: (bigint | undefined)[]): boolean {
    return values.every((value) => value === undefined || value <= BigInt(Number.MAX_SAFE_INTEGER));
}
