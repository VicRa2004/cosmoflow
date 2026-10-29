-- AlterTable
ALTER TABLE "tarea" ADD COLUMN     "tar_fkequipo" INTEGER,
ADD COLUMN     "tar_fkorganizacion" INTEGER,
ADD COLUMN     "tar_fkproyecto" INTEGER;

-- CreateTable
CREATE TABLE "tarea_responsable" (
    "tre_fkorganizacion" INTEGER NOT NULL,
    "tre_fktarea" INTEGER NOT NULL,
    "tre_fkusuario" INTEGER NOT NULL,

    CONSTRAINT "tarea_responsable_pkey" PRIMARY KEY ("tre_fktarea","tre_fkusuario")
);

-- CreateIndex
CREATE INDEX "tarea_responsable_tre_fkorganizacion_tre_fkusuario_idx" ON "tarea_responsable"("tre_fkorganizacion", "tre_fkusuario");

-- CreateIndex
CREATE INDEX "tarea_tar_fkequipo_idx" ON "tarea"("tar_fkequipo");

-- CreateIndex
CREATE INDEX "tarea_tar_fkproyecto_idx" ON "tarea"("tar_fkproyecto");

-- CreateIndex
CREATE UNIQUE INDEX "tarea_tar_fkorganizacion_tar_id_key" ON "tarea"("tar_fkorganizacion", "tar_id");

-- AddForeignKey
ALTER TABLE "tarea" ADD CONSTRAINT "tarea_tar_fkorganizacion_tar_fkequipo_fkey" FOREIGN KEY ("tar_fkorganizacion", "tar_fkequipo") REFERENCES "equipo"("eq_fkorganizacion", "eq_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarea" ADD CONSTRAINT "tarea_tar_fkorganizacion_tar_fkproyecto_fkey" FOREIGN KEY ("tar_fkorganizacion", "tar_fkproyecto") REFERENCES "proyecto"("pry_fkorganizacion", "pry_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarea_responsable" ADD CONSTRAINT "tarea_responsable_tre_fkorganizacion_tre_fktarea_fkey" FOREIGN KEY ("tre_fkorganizacion", "tre_fktarea") REFERENCES "tarea"("tar_fkorganizacion", "tar_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarea_responsable" ADD CONSTRAINT "tarea_responsable_tre_fkorganizacion_tre_fkusuario_fkey" FOREIGN KEY ("tre_fkorganizacion", "tre_fkusuario") REFERENCES "miembro_organizacion"("mor_fkorganizacion", "mor_fkusuario") ON DELETE CASCADE ON UPDATE CASCADE;


-- RN-40: equipo o proyecto, nunca los dos; la organización va con ellos.
ALTER TABLE "tarea" ADD CONSTRAINT "tarea_un_contexto"
  CHECK (
    ("tar_fkequipo" IS NULL OR "tar_fkproyecto" IS NULL)
    AND (("tar_fkorganizacion" IS NULL) = ("tar_fkequipo" IS NULL AND "tar_fkproyecto" IS NULL))
  );
