-- CreateIndex
CREATE INDEX "LedgerEntry_userId_asset_ledgerReason_idx" ON "LedgerEntry"("userId", "asset", "ledgerReason");
