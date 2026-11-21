-- AlterTable
ALTER TABLE "nota" ADD COLUMN     "not_fijada" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "tarea" ADD COLUMN     "tar_fijada" BOOLEAN NOT NULL DEFAULT false;
