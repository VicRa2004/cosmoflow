-- CreateEnum
CREATE TYPE "recurrencia_tarea" AS ENUM ('diaria', 'semanal', 'mensual');

-- AlterTable
ALTER TABLE "tarea" ADD COLUMN     "tar_recurrencia" "recurrencia_tarea";

-- CreateTable
CREATE TABLE "subtarea" (
    "sub_id" SERIAL NOT NULL,
    "sub_fktarea" INTEGER NOT NULL,
    "sub_titulo" VARCHAR(255) NOT NULL,
    "sub_completada" BOOLEAN NOT NULL DEFAULT false,
    "sub_orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "subtarea_pkey" PRIMARY KEY ("sub_id")
);

-- CreateIndex
CREATE INDEX "subtarea_sub_fktarea_sub_orden_idx" ON "subtarea"("sub_fktarea", "sub_orden");

-- AddForeignKey
ALTER TABLE "subtarea" ADD CONSTRAINT "subtarea_sub_fktarea_fkey" FOREIGN KEY ("sub_fktarea") REFERENCES "tarea"("tar_id") ON DELETE CASCADE ON UPDATE CASCADE;
