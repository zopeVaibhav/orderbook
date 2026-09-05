-- CreateTable
CREATE TABLE "Balance" (
    "userId" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "available" DECIMAL(38,18) NOT NULL DEFAULT 0,
    "locked" DECIMAL(38,18) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Balance_pkey" PRIMARY KEY ("userId","asset")
);

-- AddForeignKey
ALTER TABLE "Balance" ADD CONSTRAINT "Balance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Balance" ADD CONSTRAINT "Balance_asset_fkey" FOREIGN KEY ("asset") REFERENCES "Asset"("symbol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill the projection from the ledger it is derived from.
INSERT INTO "Balance" ("userId", "asset", "available", "locked", "updatedAt")
SELECT
    "userId",
    "asset",
    SUM("amount"),
    COALESCE(-SUM("amount") FILTER (WHERE "ledgerReason" IN ('RESERVE', 'RELEASE')), 0),
    NOW()
FROM "LedgerEntry"
GROUP BY "userId", "asset";
