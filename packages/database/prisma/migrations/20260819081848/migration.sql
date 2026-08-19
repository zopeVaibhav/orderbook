/*
  Warnings:

  - Added the required column `decimals` to the `Asset` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Asset` table without a default value. This is not possible if the table is not empty.
  - Added the required column `makerFeeBps` to the `Markets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `minQuantity` to the `Markets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `takerFeeBps` to the `Markets` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Side" AS ENUM ('BID', 'ASK');

-- CreateEnum
CREATE TYPE "OrderKind" AS ENUM ('LIMIT', 'MARKET');

-- CreateEnum
CREATE TYPE "TimeInForce" AS ENUM ('GTC', 'IOC', 'FOK', 'POST_ONLY');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'RESTED', 'PARTIAL', 'FILLED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MarketStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DELISTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LedgerReason" ADD VALUE 'RESERVE';
ALTER TYPE "LedgerReason" ADD VALUE 'RELEASE';

-- AlterEnum
ALTER TYPE "RefType" ADD VALUE 'ORDER';

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "decimals" INTEGER NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Markets" ADD COLUMN     "makerFeeBps" INTEGER NOT NULL,
ADD COLUMN     "minQuantity" BIGINT NOT NULL,
ADD COLUMN     "status" "MarketStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "takerFeeBps" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "clientOrderId" TEXT NOT NULL,
    "side" "Side" NOT NULL,
    "kind" "OrderKind" NOT NULL,
    "timeInForce" "TimeInForce",
    "price" DECIMAL(38,18),
    "quantity" DECIMAL(38,18) NOT NULL,
    "filledQuantity" DECIMAL(38,18) NOT NULL DEFAULT 0,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "rejectReason" TEXT,
    "engineSeq" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "tradeId" BIGINT NOT NULL,
    "marketId" TEXT NOT NULL,
    "price" DECIMAL(38,18) NOT NULL,
    "quantity" DECIMAL(38,18) NOT NULL,
    "makerUserId" TEXT NOT NULL,
    "makerClientOrderId" TEXT NOT NULL,
    "takerUserId" TEXT NOT NULL,
    "takerClientOrderId" TEXT NOT NULL,
    "takerSide" "Side" NOT NULL,
    "ts" BIGINT NOT NULL,
    "seq" BIGINT NOT NULL,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("marketId","tradeId")
);

-- CreateIndex
CREATE INDEX "Order_userId_status_idx" ON "Order"("userId", "status");

-- CreateIndex
CREATE INDEX "Order_marketId_status_idx" ON "Order"("marketId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Order_userId_clientOrderId_key" ON "Order"("userId", "clientOrderId");

-- CreateIndex
CREATE INDEX "Trade_marketId_ts_idx" ON "Trade"("marketId", "ts");

-- CreateIndex
CREATE INDEX "Trade_makerUserId_ts_idx" ON "Trade"("makerUserId", "ts");

-- CreateIndex
CREATE INDEX "Trade_takerUserId_ts_idx" ON "Trade"("takerUserId", "ts");

-- CreateIndex
CREATE INDEX "LedgerEntry_userId_asset_idx" ON "LedgerEntry"("userId", "asset");

-- CreateIndex
CREATE INDEX "LedgerEntry_userId_timestamp_idx" ON "LedgerEntry"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "LedgerEntry_refType_refId_idx" ON "LedgerEntry"("refType", "refId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Markets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Markets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_makerUserId_makerClientOrderId_fkey" FOREIGN KEY ("makerUserId", "makerClientOrderId") REFERENCES "Order"("userId", "clientOrderId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_takerUserId_takerClientOrderId_fkey" FOREIGN KEY ("takerUserId", "takerClientOrderId") REFERENCES "Order"("userId", "clientOrderId") ON DELETE RESTRICT ON UPDATE CASCADE;
