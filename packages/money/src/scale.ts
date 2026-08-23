/**
 * One rounding rule for the whole repo: the browser, the API, and the engine
 * must agree on what "0.001 BTC" is, or orders drift between them.
 */

const DECIMAL = /^\d+(\.\d+)?$/;

/**
 * Null when the value is not a plain decimal or is finer than the exponent —
 * too much precision is a rejected order, not a rounding opportunity.
 */
export function scale(value: string, exp: number): bigint | null {
    const trimmed = value.trim();
    if (!DECIMAL.test(trimmed)) return null;

    const [whole, fraction = ''] = trimmed.split('.');
    if (fraction.length > exp) return null;

    return BigInt(whole + fraction.padEnd(exp, '0'));
}

/** Scaled integer back to a decimal string, for display and for the ledger. */
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

/** The smallest increment the exponent allows, as an input step or hint. */
export function stepFor(exp: number): string {
    return exp <= 0 ? '1' : `0.${'0'.repeat(exp - 1)}1`;
}

/**
 * JSON carries the engine's u64 as a double, so anything past 2^53 arrives as a
 * different number than was sent.
 */
export function isJsonSafe(...values: (bigint | undefined)[]): boolean {
    return values.every((value) => value === undefined || value <= BigInt(Number.MAX_SAFE_INTEGER));
}
