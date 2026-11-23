-- CreateTable
CREATE TABLE "plantilla_tarea" (
    "ptl_id" SERIAL NOT NULL,
    "ptl_fkusuario" INTEGER,
    "ptl_fkorganizacion" INTEGER,
    "ptl_nombre" VARCHAR(100) NOT NULL,
    "ptl_titulo" VARCHAR(255) NOT NULL,
    "ptl_contenido" TEXT NOT NULL DEFAULT '',
    "ptl_prioridad" "prioridad_tarea" NOT NULL DEFAULT 'media',
    "ptl_color" VARCHAR(7),
    "ptl_subtareas" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "plantilla_tarea_pkey" PRIMARY KEY ("ptl_id")
);

-- CreateIndex
CREATE INDEX "plantilla_tarea_ptl_fkusuario_idx" ON "plantilla_tarea"("ptl_fkusuario");

-- CreateIndex
CREATE INDEX "plantilla_tarea_ptl_fkorganizacion_idx" ON "plantilla_tarea"("ptl_fkorganizacion");

-- AddForeignKey
ALTER TABLE "plantilla_tarea" ADD CONSTRAINT "plantilla_tarea_ptl_fkusuario_fkey" FOREIGN KEY ("ptl_fkusuario") REFERENCES "usuario"("usr_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantilla_tarea" ADD CONSTRAINT "plantilla_tarea_ptl_fkorganizacion_fkey" FOREIGN KEY ("ptl_fkorganizacion") REFERENCES "organizacion"("org_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Una plantilla es de un usuario o de una organización, nunca de los dos.
ALTER TABLE "plantilla_tarea" ADD CONSTRAINT "plantilla_tarea_un_solo_dueno"
    CHECK (("ptl_fkusuario" IS NULL) <> ("ptl_fkorganizacion" IS NULL));
