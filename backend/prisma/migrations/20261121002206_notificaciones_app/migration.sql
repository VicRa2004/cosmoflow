-- CreateTable
CREATE TABLE "notificacion" (
    "ntf_id" SERIAL NOT NULL,
    "ntf_fkusuario" INTEGER NOT NULL,
    "ntf_asunto" VARCHAR(255) NOT NULL,
    "ntf_texto" TEXT NOT NULL,
    "ntf_enlace" VARCHAR(512) NOT NULL,
    "ntf_tipo" VARCHAR(20),
    "ntf_recurso_id" INTEGER,
    "ntf_leida_en" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacion_pkey" PRIMARY KEY ("ntf_id")
);

-- CreateIndex
CREATE INDEX "notificacion_ntf_fkusuario_ntf_leida_en_ntf_id_idx" ON "notificacion"("ntf_fkusuario", "ntf_leida_en", "ntf_id");

-- CreateIndex
CREATE INDEX "notificacion_ntf_fkusuario_ntf_id_idx" ON "notificacion"("ntf_fkusuario", "ntf_id");

-- AddForeignKey
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_ntf_fkusuario_fkey" FOREIGN KEY ("ntf_fkusuario") REFERENCES "usuario"("usr_id") ON DELETE CASCADE ON UPDATE CASCADE;
