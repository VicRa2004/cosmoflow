-- CreateTable
CREATE TABLE "preferencia_notificacion_organizacion" (
    "pnor_fkorganizacion" INTEGER NOT NULL,
    "pnor_evento" VARCHAR(50) NOT NULL,
    "pnor_canal" VARCHAR(20) NOT NULL,
    "pnor_activo" BOOLEAN NOT NULL,

    CONSTRAINT "preferencia_notificacion_organizacion_pkey" PRIMARY KEY ("pnor_fkorganizacion","pnor_evento","pnor_canal")
);

-- AddForeignKey
ALTER TABLE "preferencia_notificacion_organizacion" ADD CONSTRAINT "preferencia_notificacion_organizacion_pnor_fkorganizacion_fkey" FOREIGN KEY ("pnor_fkorganizacion") REFERENCES "organizacion"("org_id") ON DELETE CASCADE ON UPDATE CASCADE;
