/*
  Warnings:

  - The values [FEE] on the enum `LedgerReason` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `makerFeeBps` on the `Markets` table. All the data in the column will be lost.
  - You are about to drop the column `takerFeeBps` on the `Markets` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "LedgerReason_new" AS ENUM ('FILL', 'DEPOSIT', 'WITHDRAWAL', 'RESERVE', 'RELEASE');
ALTER TABLE "LedgerEntry" ALTER COLUMN "ledgerReason" TYPE "LedgerReason_new" USING ("ledgerReason"::text::"LedgerReason_new");
ALTER TYPE "LedgerReason" RENAME TO "LedgerReason_old";
ALTER TYPE "LedgerReason_new" RENAME TO "LedgerReason";
DROP TYPE "LedgerReason_old";
COMMIT;

-- AlterTable
ALTER TABLE "Markets" DROP COLUMN "makerFeeBps",
DROP COLUMN "takerFeeBps";
