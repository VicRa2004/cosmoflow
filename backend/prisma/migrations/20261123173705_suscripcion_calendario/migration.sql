-- CreateTable
CREATE TABLE "suscripcion_calendario" (
    "sca_fkusuario" INTEGER NOT NULL,
    "sca_token_hash" VARCHAR(64) NOT NULL,
    "sca_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suscripcion_calendario_pkey" PRIMARY KEY ("sca_fkusuario")
);

-- CreateIndex
CREATE UNIQUE INDEX "suscripcion_calendario_sca_token_hash_key" ON "suscripcion_calendario"("sca_token_hash");

-- AddForeignKey
ALTER TABLE "suscripcion_calendario" ADD CONSTRAINT "suscripcion_calendario_sca_fkusuario_fkey" FOREIGN KEY ("sca_fkusuario") REFERENCES "usuario"("usr_id") ON DELETE CASCADE ON UPDATE CASCADE;
