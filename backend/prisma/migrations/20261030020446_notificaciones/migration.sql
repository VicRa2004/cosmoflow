-- CreateTable
CREATE TABLE "preferencia_notificacion" (
    "pno_fkusuario" INTEGER NOT NULL,
    "pno_evento" VARCHAR(50) NOT NULL,
    "pno_canal" VARCHAR(20) NOT NULL,
    "pno_activo" BOOLEAN NOT NULL,

    CONSTRAINT "preferencia_notificacion_pkey" PRIMARY KEY ("pno_fkusuario","pno_evento","pno_canal")
);

-- CreateTable
CREATE TABLE "notificacion_enviada" (
    "nen_clave" VARCHAR(255) NOT NULL,
    "nen_enviada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacion_enviada_pkey" PRIMARY KEY ("nen_clave")
);

-- CreateIndex
CREATE INDEX "notificacion_enviada_nen_enviada_en_idx" ON "notificacion_enviada"("nen_enviada_en");

-- AddForeignKey
ALTER TABLE "preferencia_notificacion" ADD CONSTRAINT "preferencia_notificacion_pno_fkusuario_fkey" FOREIGN KEY ("pno_fkusuario") REFERENCES "usuario"("usr_id") ON DELETE CASCADE ON UPDATE CASCADE;
