-- AlterTable
ALTER TABLE "tarea" ADD COLUMN     "tar_fkdepende_de" INTEGER;

-- AddForeignKey
ALTER TABLE "tarea" ADD CONSTRAINT "tarea_tar_fkdepende_de_fkey" FOREIGN KEY ("tar_fkdepende_de") REFERENCES "tarea"("tar_id") ON DELETE SET NULL ON UPDATE CASCADE;
