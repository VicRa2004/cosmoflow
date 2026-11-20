-- AlterTable
ALTER TABLE "token_personal" ADD COLUMN     "tkp_client_id" VARCHAR(255),
ADD COLUMN     "tkp_expira_en" TIMESTAMP(3),
ADD COLUMN     "tkp_refresh_hash" VARCHAR(128),
ADD COLUMN     "tkp_ultimo_uso_en" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "token_personal_tkp_refresh_hash_key" ON "token_personal"("tkp_refresh_hash");

