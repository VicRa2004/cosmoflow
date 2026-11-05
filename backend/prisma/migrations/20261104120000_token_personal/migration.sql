-- CreateTable
CREATE TABLE "token_personal" (
    "tkp_id" SERIAL NOT NULL,
    "tkp_nombre" VARCHAR(100) NOT NULL,
    "tkp_token_hash" VARCHAR(128) NOT NULL,
    "tkp_pista" VARCHAR(4) NOT NULL,
    "tkp_fkusuario" INTEGER NOT NULL,
    "tkp_revocado_en" TIMESTAMP(3),
    "tkp_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_personal_pkey" PRIMARY KEY ("tkp_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "token_personal_tkp_token_hash_key" ON "token_personal"("tkp_token_hash");

-- CreateIndex
CREATE INDEX "token_personal_tkp_fkusuario_idx" ON "token_personal"("tkp_fkusuario");

-- AddForeignKey
ALTER TABLE "token_personal" ADD CONSTRAINT "token_personal_tkp_fkusuario_fkey" FOREIGN KEY ("tkp_fkusuario") REFERENCES "usuario"("usr_id") ON DELETE CASCADE ON UPDATE CASCADE;
