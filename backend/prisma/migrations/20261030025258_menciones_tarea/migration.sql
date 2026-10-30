-- CreateTable
CREATE TABLE "tarea_mencion" (
    "tme_fktarea" INTEGER NOT NULL,
    "tme_fkusuario" INTEGER NOT NULL,

    CONSTRAINT "tarea_mencion_pkey" PRIMARY KEY ("tme_fktarea","tme_fkusuario")
);

-- CreateIndex
CREATE INDEX "tarea_mencion_tme_fkusuario_idx" ON "tarea_mencion"("tme_fkusuario");

-- AddForeignKey
ALTER TABLE "tarea_mencion" ADD CONSTRAINT "tarea_mencion_tme_fktarea_fkey" FOREIGN KEY ("tme_fktarea") REFERENCES "tarea"("tar_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarea_mencion" ADD CONSTRAINT "tarea_mencion_tme_fkusuario_fkey" FOREIGN KEY ("tme_fkusuario") REFERENCES "usuario"("usr_id") ON DELETE CASCADE ON UPDATE CASCADE;
