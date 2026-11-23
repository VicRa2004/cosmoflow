-- AlterTable
ALTER TABLE "comentario_tarea" ADD COLUMN     "cot_fkpadre" INTEGER;

-- CreateIndex
CREATE INDEX "comentario_tarea_cot_fkpadre_idx" ON "comentario_tarea"("cot_fkpadre");

-- AddForeignKey
ALTER TABLE "comentario_tarea" ADD CONSTRAINT "comentario_tarea_cot_fkpadre_fkey" FOREIGN KEY ("cot_fkpadre") REFERENCES "comentario_tarea"("cot_id") ON DELETE CASCADE ON UPDATE CASCADE;
