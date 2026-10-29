-- CreateEnum
CREATE TYPE "estado_proyecto" AS ENUM ('activo', 'en_pausa', 'terminado');

-- CreateTable
CREATE TABLE "proyecto" (
    "pry_id" SERIAL NOT NULL,
    "pry_fkorganizacion" INTEGER NOT NULL,
    "pry_nombre" VARCHAR(100) NOT NULL,
    "pry_descripcion" VARCHAR(500) NOT NULL DEFAULT '',
    "pry_estado" "estado_proyecto" NOT NULL DEFAULT 'activo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "proyecto_pkey" PRIMARY KEY ("pry_id")
);

-- CreateTable
CREATE TABLE "proyecto_equipo" (
    "pre_fkorganizacion" INTEGER NOT NULL,
    "pre_fkproyecto" INTEGER NOT NULL,
    "pre_fkequipo" INTEGER NOT NULL,

    CONSTRAINT "proyecto_equipo_pkey" PRIMARY KEY ("pre_fkproyecto","pre_fkequipo")
);

-- CreateTable
CREATE TABLE "integrante_proyecto" (
    "ipr_fkorganizacion" INTEGER NOT NULL,
    "ipr_fkproyecto" INTEGER NOT NULL,
    "ipr_fkusuario" INTEGER NOT NULL,

    CONSTRAINT "integrante_proyecto_pkey" PRIMARY KEY ("ipr_fkproyecto","ipr_fkusuario")
);

-- CreateIndex
CREATE INDEX "proyecto_pry_fkorganizacion_idx" ON "proyecto"("pry_fkorganizacion");

-- CreateIndex
CREATE UNIQUE INDEX "proyecto_pry_fkorganizacion_pry_id_key" ON "proyecto"("pry_fkorganizacion", "pry_id");

-- CreateIndex
CREATE INDEX "proyecto_equipo_pre_fkorganizacion_pre_fkequipo_idx" ON "proyecto_equipo"("pre_fkorganizacion", "pre_fkequipo");

-- CreateIndex
CREATE INDEX "integrante_proyecto_ipr_fkorganizacion_ipr_fkusuario_idx" ON "integrante_proyecto"("ipr_fkorganizacion", "ipr_fkusuario");

-- AddForeignKey
ALTER TABLE "proyecto" ADD CONSTRAINT "proyecto_pry_fkorganizacion_fkey" FOREIGN KEY ("pry_fkorganizacion") REFERENCES "organizacion"("org_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_equipo" ADD CONSTRAINT "proyecto_equipo_pre_fkorganizacion_pre_fkproyecto_fkey" FOREIGN KEY ("pre_fkorganizacion", "pre_fkproyecto") REFERENCES "proyecto"("pry_fkorganizacion", "pry_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_equipo" ADD CONSTRAINT "proyecto_equipo_pre_fkorganizacion_pre_fkequipo_fkey" FOREIGN KEY ("pre_fkorganizacion", "pre_fkequipo") REFERENCES "equipo"("eq_fkorganizacion", "eq_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrante_proyecto" ADD CONSTRAINT "integrante_proyecto_ipr_fkorganizacion_ipr_fkproyecto_fkey" FOREIGN KEY ("ipr_fkorganizacion", "ipr_fkproyecto") REFERENCES "proyecto"("pry_fkorganizacion", "pry_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrante_proyecto" ADD CONSTRAINT "integrante_proyecto_ipr_fkorganizacion_ipr_fkusuario_fkey" FOREIGN KEY ("ipr_fkorganizacion", "ipr_fkusuario") REFERENCES "miembro_organizacion"("mor_fkorganizacion", "mor_fkusuario") ON DELETE CASCADE ON UPDATE CASCADE;
