-- AlterTable
ALTER TABLE "adjunto" ADD COLUMN     "adj_fkorganizacion" INTEGER;

-- CreateIndex
CREATE INDEX "tarea_tar_fkorganizacion_idx" ON "tarea"("tar_fkorganizacion");

-- AddForeignKey
ALTER TABLE "tarea" ADD CONSTRAINT "tarea_tar_fkorganizacion_fkey" FOREIGN KEY ("tar_fkorganizacion") REFERENCES "organizacion"("org_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adjunto" ADD CONSTRAINT "adjunto_adj_fkorganizacion_fkey" FOREIGN KEY ("adj_fkorganizacion") REFERENCES "organizacion"("org_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RN-40: de la organización, de un equipo o de un proyecto (nunca equipo y proyecto
-- a la vez); con equipo o proyecto, la organización va con ellos. Sin organización, personal.
ALTER TABLE "tarea" DROP CONSTRAINT "tarea_un_contexto";
ALTER TABLE "tarea" ADD CONSTRAINT "tarea_un_contexto"
  CHECK (
    ("tar_fkequipo" IS NULL OR "tar_fkproyecto" IS NULL)
    AND ("tar_fkorganizacion" IS NOT NULL OR ("tar_fkequipo" IS NULL AND "tar_fkproyecto" IS NULL))
  );

-- Un adjunto se comparte con una organización, un equipo o un proyecto: solo uno.
ALTER TABLE "adjunto" DROP CONSTRAINT "adjunto_un_ambito";
ALTER TABLE "adjunto" ADD CONSTRAINT "adjunto_un_ambito"
  CHECK (num_nonnulls("adj_fkorganizacion", "adj_fkequipo", "adj_fkproyecto") <= 1);
