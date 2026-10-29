-- CreateTable
CREATE TABLE "equipo" (
    "eq_id" SERIAL NOT NULL,
    "eq_fkorganizacion" INTEGER NOT NULL,
    "eq_nombre" VARCHAR(100) NOT NULL,
    "eq_descripcion" VARCHAR(500) NOT NULL DEFAULT '',
    "eq_color" VARCHAR(7) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "equipo_pkey" PRIMARY KEY ("eq_id")
);

-- CreateTable
CREATE TABLE "miembro_equipo" (
    "meq_fkorganizacion" INTEGER NOT NULL,
    "meq_fkequipo" INTEGER NOT NULL,
    "meq_fkusuario" INTEGER NOT NULL,
    "meq_is_lider" BOOLEAN NOT NULL DEFAULT false,
    "meq_puede_crear_tareas" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "miembro_equipo_pkey" PRIMARY KEY ("meq_fkequipo","meq_fkusuario")
);

-- CreateTable
CREATE TABLE "equipo_tag" (
    "eqt_fkequipo" INTEGER NOT NULL,
    "eqt_fktag" INTEGER NOT NULL,

    CONSTRAINT "equipo_tag_pkey" PRIMARY KEY ("eqt_fkequipo","eqt_fktag")
);

-- CreateIndex
CREATE INDEX "equipo_eq_fkorganizacion_idx" ON "equipo"("eq_fkorganizacion");

-- CreateIndex
CREATE UNIQUE INDEX "equipo_eq_fkorganizacion_eq_id_key" ON "equipo"("eq_fkorganizacion", "eq_id");

-- CreateIndex
CREATE INDEX "miembro_equipo_meq_fkorganizacion_meq_fkusuario_idx" ON "miembro_equipo"("meq_fkorganizacion", "meq_fkusuario");

-- CreateIndex
CREATE INDEX "equipo_tag_eqt_fktag_idx" ON "equipo_tag"("eqt_fktag");

-- AddForeignKey
ALTER TABLE "equipo" ADD CONSTRAINT "equipo_eq_fkorganizacion_fkey" FOREIGN KEY ("eq_fkorganizacion") REFERENCES "organizacion"("org_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "miembro_equipo" ADD CONSTRAINT "miembro_equipo_meq_fkorganizacion_meq_fkequipo_fkey" FOREIGN KEY ("meq_fkorganizacion", "meq_fkequipo") REFERENCES "equipo"("eq_fkorganizacion", "eq_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "miembro_equipo" ADD CONSTRAINT "miembro_equipo_meq_fkorganizacion_meq_fkusuario_fkey" FOREIGN KEY ("meq_fkorganizacion", "meq_fkusuario") REFERENCES "miembro_organizacion"("mor_fkorganizacion", "mor_fkusuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipo_tag" ADD CONSTRAINT "equipo_tag_eqt_fkequipo_fkey" FOREIGN KEY ("eqt_fkequipo") REFERENCES "equipo"("eq_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipo_tag" ADD CONSTRAINT "equipo_tag_eqt_fktag_fkey" FOREIGN KEY ("eqt_fktag") REFERENCES "tag"("tag_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RN-21: como mucho un líder por equipo.
CREATE UNIQUE INDEX "miembro_equipo_un_lider" ON "miembro_equipo"("meq_fkequipo") WHERE "meq_is_lider";
