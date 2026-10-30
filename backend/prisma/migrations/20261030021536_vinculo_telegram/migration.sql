-- CreateTable
CREATE TABLE "vinculo_telegram" (
    "vte_fkusuario" INTEGER NOT NULL,
    "vte_chat_id" VARCHAR(32),
    "vte_token_hash" VARCHAR(64),
    "vte_token_expira_en" TIMESTAMP(3),
    "vte_vinculado_en" TIMESTAMP(3),

    CONSTRAINT "vinculo_telegram_pkey" PRIMARY KEY ("vte_fkusuario")
);

-- CreateIndex
CREATE UNIQUE INDEX "vinculo_telegram_vte_chat_id_key" ON "vinculo_telegram"("vte_chat_id");

-- CreateIndex
CREATE UNIQUE INDEX "vinculo_telegram_vte_token_hash_key" ON "vinculo_telegram"("vte_token_hash");

-- AddForeignKey
ALTER TABLE "vinculo_telegram" ADD CONSTRAINT "vinculo_telegram_vte_fkusuario_fkey" FOREIGN KEY ("vte_fkusuario") REFERENCES "usuario"("usr_id") ON DELETE CASCADE ON UPDATE CASCADE;
