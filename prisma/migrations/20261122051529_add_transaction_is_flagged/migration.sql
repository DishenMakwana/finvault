-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "is_flagged" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "transactions_user_id_is_flagged_deletedat_idx" ON "transactions"("user_id", "is_flagged", "deletedat");
