-- CreateTable
CREATE TABLE "dos_pasos" (
    "dps_fkusuario" INTEGER NOT NULL,
    "dps_secreto_cifrado" VARCHAR(255) NOT NULL,
    "dps_activado_en" TIMESTAMP(3),
    "dps_ultimo_paso" INTEGER NOT NULL DEFAULT 0,
    "dps_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dos_pasos_pkey" PRIMARY KEY ("dps_fkusuario")
);

-- CreateTable
CREATE TABLE "codigo_recuperacion" (
    "cdr_id" SERIAL NOT NULL,
    "cdr_fkusuario" INTEGER NOT NULL,
    "cdr_codigo_hash" VARCHAR(64) NOT NULL,
    "cdr_usado_en" TIMESTAMP(3),

    CONSTRAINT "codigo_recuperacion_pkey" PRIMARY KEY ("cdr_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "codigo_recuperacion_cdr_fkusuario_cdr_codigo_hash_key" ON "codigo_recuperacion"("cdr_fkusuario", "cdr_codigo_hash");

-- AddForeignKey
ALTER TABLE "dos_pasos" ADD CONSTRAINT "dos_pasos_dps_fkusuario_fkey" FOREIGN KEY ("dps_fkusuario") REFERENCES "usuario"("usr_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codigo_recuperacion" ADD CONSTRAINT "codigo_recuperacion_cdr_fkusuario_fkey" FOREIGN KEY ("cdr_fkusuario") REFERENCES "dos_pasos"("dps_fkusuario") ON DELETE CASCADE ON UPDATE CASCADE;
