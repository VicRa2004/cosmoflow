-- AlterTable
ALTER TABLE "tarea_responsable" ADD COLUMN     "tre_fkasignado_por" INTEGER;

-- AddForeignKey
ALTER TABLE "tarea_responsable" ADD CONSTRAINT "tarea_responsable_tre_fkasignado_por_fkey" FOREIGN KEY ("tre_fkasignado_por") REFERENCES "usuario"("usr_id") ON DELETE SET NULL ON UPDATE CASCADE;
