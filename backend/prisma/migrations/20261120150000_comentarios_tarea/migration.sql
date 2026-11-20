-- CreateTable
CREATE TABLE "comentario_tarea" (
    "cot_id" SERIAL NOT NULL,
    "cot_fktarea" INTEGER NOT NULL,
    "cot_fkautor" INTEGER NOT NULL,
    "cot_contenido" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cot_editado_en" TIMESTAMP(3),

    CONSTRAINT "comentario_tarea_pkey" PRIMARY KEY ("cot_id")
);

-- CreateIndex
CREATE INDEX "comentario_tarea_cot_fktarea_cot_id_idx" ON "comentario_tarea"("cot_fktarea", "cot_id");

-- AddForeignKey
ALTER TABLE "comentario_tarea" ADD CONSTRAINT "comentario_tarea_cot_fktarea_fkey" FOREIGN KEY ("cot_fktarea") REFERENCES "tarea"("tar_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentario_tarea" ADD CONSTRAINT "comentario_tarea_cot_fkautor_fkey" FOREIGN KEY ("cot_fkautor") REFERENCES "usuario"("usr_id") ON DELETE CASCADE ON UPDATE CASCADE;

