-- CreateTable
CREATE TABLE "clave_idempotencia" (
    "cid_fkusuario" INTEGER NOT NULL,
    "cid_clave" VARCHAR(100) NOT NULL,
    "cid_status" INTEGER,
    "cid_respuesta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clave_idempotencia_pkey" PRIMARY KEY ("cid_fkusuario","cid_clave")
);

-- CreateIndex
CREATE INDEX "clave_idempotencia_created_at_idx" ON "clave_idempotencia"("created_at");

-- AddForeignKey
ALTER TABLE "clave_idempotencia" ADD CONSTRAINT "clave_idempotencia_cid_fkusuario_fkey" FOREIGN KEY ("cid_fkusuario") REFERENCES "usuario"("usr_id") ON DELETE CASCADE ON UPDATE CASCADE;
