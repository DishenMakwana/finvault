-- Enable pg_trgm extension for substring, wildcard, and fuzzy searching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex: Houses - soft-delete and chronological ordering
CREATE INDEX IF NOT EXISTS "houses_deletedat_createdAt_idx" ON "houses"("deletedat", "createdAt" ASC);

-- CreateIndex: Loans - soft-delete and largest amount ordering
CREATE INDEX IF NOT EXISTS "loans_deletedat_total_amount_createdAt_idx" ON "loans"("deletedat", "total_amount" DESC, "createdAt" DESC);

-- CreateIndex: Transactions - soft-delete and date ordering
CREATE INDEX IF NOT EXISTS "transactions_deletedat_date_of_add_idx" ON "transactions"("deletedat", "date_of_add" DESC);

-- CreateIndex: Transactions - timeline outflow/inflow filtering
CREATE INDEX IF NOT EXISTS "transactions_deletedat_type_date_of_add_idx" ON "transactions"("deletedat", "type", "date_of_add" DESC);

-- CreateIndex: Transactions - covering index for category aggregations and benchmark analytics (Index-Only Scan)
CREATE INDEX IF NOT EXISTS "transactions_deletedat_type_category_amount_idx" ON "transactions"("deletedat", "type", "category", "amount");

-- CreateIndex: Transactions - house-scoped timeline queries
CREATE INDEX IF NOT EXISTS "transactions_house_id_deletedat_type_date_of_add_idx" ON "transactions"("house_id", "deletedat", "type", "date_of_add" DESC);

-- CreateIndex: Transactions - Trigram GIN indexes for fast ILIKE keyword search (%term%)
CREATE INDEX IF NOT EXISTS "transactions_title_trgm_idx" ON "transactions" USING GIN ("title" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "transactions_desc_trgm_idx" ON "transactions" USING GIN ("desc" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "transactions_category_trgm_idx" ON "transactions" USING GIN ("category" gin_trgm_ops);
