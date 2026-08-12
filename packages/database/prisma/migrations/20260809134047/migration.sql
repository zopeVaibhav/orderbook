-- CreateEnum
CREATE TYPE "RefType" AS ENUM ('TRADE', 'DEPOSIT', 'WITHDRAWAL');

-- CreateEnum
CREATE TYPE "LedgerReason" AS ENUM ('FILL', 'FEE', 'DEPOSIT', 'WITHDRAWAL');

-- DropIndex
DROP INDEX "User_email_idx";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "image" DROP NOT NULL;

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "refType" "RefType" NOT NULL,
    "ledgerReason" "LedgerReason" NOT NULL,
    "asset" TEXT NOT NULL,
    "amount" DECIMAL(38,18) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Markets" (
    "id" TEXT NOT NULL,
    "base" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "lotExp" INTEGER NOT NULL,
    "tickExp" INTEGER NOT NULL,

    CONSTRAINT "Markets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "symbol" TEXT NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("symbol")
);

-- CreateIndex
CREATE UNIQUE INDEX "LedgerEntry_refId_refType_ledgerReason_asset_userId_key" ON "LedgerEntry"("refId", "refType", "ledgerReason", "asset", "userId");

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_asset_fkey" FOREIGN KEY ("asset") REFERENCES "Asset"("symbol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Markets" ADD CONSTRAINT "Markets_base_fkey" FOREIGN KEY ("base") REFERENCES "Asset"("symbol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Markets" ADD CONSTRAINT "Markets_quote_fkey" FOREIGN KEY ("quote") REFERENCES "Asset"("symbol") ON DELETE RESTRICT ON UPDATE CASCADE;
