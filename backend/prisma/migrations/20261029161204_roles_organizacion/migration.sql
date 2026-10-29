-- CreateTable
CREATE TABLE "rol_organizacion" (
    "rog_id" SERIAL NOT NULL,
    "rog_fkorganizacion" INTEGER NOT NULL,
    "rog_nombre" VARCHAR(64) NOT NULL,
    "rog_permisos" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "rol_organizacion_pkey" PRIMARY KEY ("rog_id")
);

-- CreateTable
CREATE TABLE "miembro_rol_organizacion" (
    "mro_fkorganizacion" INTEGER NOT NULL,
    "mro_fkusuario" INTEGER NOT NULL,
    "mro_fkrol" INTEGER NOT NULL,

    CONSTRAINT "miembro_rol_organizacion_pkey" PRIMARY KEY ("mro_fkorganizacion","mro_fkusuario","mro_fkrol")
);

-- CreateIndex
CREATE INDEX "rol_organizacion_rog_fkorganizacion_idx" ON "rol_organizacion"("rog_fkorganizacion");

-- CreateIndex
CREATE UNIQUE INDEX "rol_organizacion_rog_fkorganizacion_rog_id_key" ON "rol_organizacion"("rog_fkorganizacion", "rog_id");

-- CreateIndex
CREATE INDEX "miembro_rol_organizacion_mro_fkorganizacion_mro_fkrol_idx" ON "miembro_rol_organizacion"("mro_fkorganizacion", "mro_fkrol");

-- AddForeignKey
ALTER TABLE "rol_organizacion" ADD CONSTRAINT "rol_organizacion_rog_fkorganizacion_fkey" FOREIGN KEY ("rog_fkorganizacion") REFERENCES "organizacion"("org_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "miembro_rol_organizacion" ADD CONSTRAINT "miembro_rol_organizacion_mro_fkorganizacion_mro_fkusuario_fkey" FOREIGN KEY ("mro_fkorganizacion", "mro_fkusuario") REFERENCES "miembro_organizacion"("mor_fkorganizacion", "mor_fkusuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "miembro_rol_organizacion" ADD CONSTRAINT "miembro_rol_organizacion_mro_fkorganizacion_mro_fkrol_fkey" FOREIGN KEY ("mro_fkorganizacion", "mro_fkrol") REFERENCES "rol_organizacion"("rog_fkorganizacion", "rog_id") ON DELETE CASCADE ON UPDATE CASCADE;
