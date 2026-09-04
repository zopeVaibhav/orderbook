import { prisma } from '../prisma';

/**
 * Recomputes every Balance row from ledger_entries. The projection is derived
 * data, so this is always safe to run and is the fix for any drift.
 */
async function main() {
    const rows = await prisma.$executeRaw`
        INSERT INTO "Balance" ("userId", "asset", "available", "locked", "updatedAt")
        SELECT
            "userId",
            "asset",
            SUM("amount"),
            COALESCE(-SUM("amount") FILTER (WHERE "ledgerReason" IN ('RESERVE', 'RELEASE')), 0),
            NOW()
        FROM "LedgerEntry"
        GROUP BY "userId", "asset"
        ON CONFLICT ("userId", "asset") DO UPDATE SET
            "available" = EXCLUDED."available",
            "locked" = EXCLUDED."locked",
            "updatedAt" = NOW()
    `;

    console.log(`rebuilt ${rows} balances`);
}

main()
    .catch((error) => {
        console.error('rebuild-balances failed:', error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
