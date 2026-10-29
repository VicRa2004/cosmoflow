-- CreateEnum
CREATE TYPE "estado_tarea" AS ENUM ('pendiente', 'en_progreso', 'completada', 'cancelada');

-- CreateEnum
CREATE TYPE "prioridad_tarea" AS ENUM ('baja', 'media', 'alta');

-- CreateTable
CREATE TABLE "tarea" (
    "tar_id" SERIAL NOT NULL,
    "tar_fkusuario" INTEGER NOT NULL,
    "tar_titulo" VARCHAR(255) NOT NULL,
    "tar_contenido" TEXT NOT NULL DEFAULT '',
    "tar_estado" "estado_tarea" NOT NULL DEFAULT 'pendiente',
    "tar_prioridad" "prioridad_tarea" NOT NULL DEFAULT 'media',
    "tar_fecha_inicio" DATE,
    "tar_fecha_vencimiento" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tarea_pkey" PRIMARY KEY ("tar_id")
);

-- CreateTable
CREATE TABLE "tarea_tag" (
    "tat_fktarea" INTEGER NOT NULL,
    "tat_fktag" INTEGER NOT NULL,

    CONSTRAINT "tarea_tag_pkey" PRIMARY KEY ("tat_fktarea","tat_fktag")
);

-- CreateIndex
CREATE INDEX "tarea_tar_fkusuario_tar_estado_idx" ON "tarea"("tar_fkusuario", "tar_estado");

-- CreateIndex
CREATE INDEX "tarea_tag_tat_fktag_idx" ON "tarea_tag"("tat_fktag");

-- AddForeignKey
ALTER TABLE "tarea" ADD CONSTRAINT "tarea_tar_fkusuario_fkey" FOREIGN KEY ("tar_fkusuario") REFERENCES "usuario"("usr_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarea_tag" ADD CONSTRAINT "tarea_tag_tat_fktarea_fkey" FOREIGN KEY ("tat_fktarea") REFERENCES "tarea"("tar_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarea_tag" ADD CONSTRAINT "tarea_tag_tat_fktag_fkey" FOREIGN KEY ("tat_fktag") REFERENCES "tag"("tag_id") ON DELETE CASCADE ON UPDATE CASCADE;

