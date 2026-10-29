-- AlterTable
ALTER TABLE "adjunto" ADD COLUMN     "adj_fkequipo" INTEGER,
ADD COLUMN     "adj_fkproyecto" INTEGER;

-- AlterTable
ALTER TABLE "nota" ADD COLUMN     "not_fkorganizacion" INTEGER,
ADD COLUMN     "not_fkproyecto" INTEGER;

-- CreateIndex
CREATE INDEX "nota_not_fkproyecto_updated_at_idx" ON "nota"("not_fkproyecto", "updated_at");

-- AddForeignKey
ALTER TABLE "nota" ADD CONSTRAINT "nota_not_fkorganizacion_not_fkproyecto_fkey" FOREIGN KEY ("not_fkorganizacion", "not_fkproyecto") REFERENCES "proyecto"("pry_fkorganizacion", "pry_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adjunto" ADD CONSTRAINT "adjunto_adj_fkequipo_fkey" FOREIGN KEY ("adj_fkequipo") REFERENCES "equipo"("eq_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adjunto" ADD CONSTRAINT "adjunto_adj_fkproyecto_fkey" FOREIGN KEY ("adj_fkproyecto") REFERENCES "proyecto"("pry_id") ON DELETE SET NULL ON UPDATE CASCADE;


-- RN-33/50: personal (sin organización ni proyecto) o de un proyecto.
ALTER TABLE "nota" ADD CONSTRAINT "nota_personal_o_proyecto"
  CHECK (("not_fkorganizacion" IS NULL) = ("not_fkproyecto" IS NULL));

-- Un adjunto se comparte con un equipo o con un proyecto, no con los dos.
ALTER TABLE "adjunto" ADD CONSTRAINT "adjunto_un_ambito"
  CHECK ("adj_fkequipo" IS NULL OR "adj_fkproyecto" IS NULL);
