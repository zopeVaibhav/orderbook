import { Prisma, LedgerReason, RefType } from '../generated/prisma/client';

export type LedgerRow = {
    userId: string;
    asset: string;
    amount: Prisma.Decimal;
    ledgerReason: LedgerReason;
    refType: RefType;
    refId: string;
};

/** RESERVE and RELEASE shift money between available and locked; every other
 *  reason only moves available. */
const MOVES_LOCKED: ReadonlySet<LedgerReason> = new Set([
    LedgerReason.RESERVE,
    LedgerReason.RELEASE,
]);

type BalanceDelta = {
    userId: string;
    asset: string;
    available: Prisma.Decimal;
    locked: Prisma.Decimal;
};

function deltasFor(rows: LedgerRow[]): BalanceDelta[] {
    const byPair = new Map<string, BalanceDelta>();

    for (const row of rows) {
        const key = `${row.userId} ${row.asset}`;
        const delta = byPair.get(key) ?? {
            userId: row.userId,
            asset: row.asset,
            available: new Prisma.Decimal(0),
            locked: new Prisma.Decimal(0),
        };

        delta.available = delta.available.add(row.amount);
        if (MOVES_LOCKED.has(row.ledgerReason)) delta.locked = delta.locked.minus(row.amount);

        byPair.set(key, delta);
    }

    /** Sorted so two transactions touching the same pairs take the row locks in
     *  the same order and cannot deadlock each other. */
    return [...byPair.values()].sort((a, b) =>
        a.userId === b.userId ? a.asset.localeCompare(b.asset) : a.userId.localeCompare(b.userId),
    );
}

/**
 * Writes ledger entries and moves the Balance projection by the same amounts.
 * Duplicates are skipped, so a replayed event is a no-op on both.
 */
export async function writeLedger(
    tx: Prisma.TransactionClient,
    rows: LedgerRow[],
): Promise<number> {
    if (rows.length === 0) return 0;

    const inserted = await tx.ledgerEntry.createMany({ data: rows, skipDuplicates: true });
    if (inserted.count === 0) return 0;

    for (const delta of deltasFor(rows)) {
        await tx.balance.upsert({
            where: { userId_asset: { userId: delta.userId, asset: delta.asset } },
            create: {
                userId: delta.userId,
                asset: delta.asset,
                available: delta.available,
                locked: delta.locked,
            },
            update: {
                available: { increment: delta.available },
                locked: { increment: delta.locked },
            },
        });
    }

    return inserted.count;
}
