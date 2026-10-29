-- CreateTable
CREATE TABLE "organizacion" (
    "org_id" SERIAL NOT NULL,
    "org_nombre" VARCHAR(100) NOT NULL,
    "org_descripcion" VARCHAR(500) NOT NULL DEFAULT '',
    "org_color" VARCHAR(7) NOT NULL,
    "org_avatar" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "organizacion_pkey" PRIMARY KEY ("org_id")
);

-- CreateTable
CREATE TABLE "miembro_organizacion" (
    "mor_fkorganizacion" INTEGER NOT NULL,
    "mor_fkusuario" INTEGER NOT NULL,
    "mor_is_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "miembro_organizacion_pkey" PRIMARY KEY ("mor_fkorganizacion","mor_fkusuario")
);

-- CreateIndex
CREATE INDEX "miembro_organizacion_mor_fkusuario_idx" ON "miembro_organizacion"("mor_fkusuario");

-- AddForeignKey
ALTER TABLE "miembro_organizacion" ADD CONSTRAINT "miembro_organizacion_mor_fkorganizacion_fkey" FOREIGN KEY ("mor_fkorganizacion") REFERENCES "organizacion"("org_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "miembro_organizacion" ADD CONSTRAINT "miembro_organizacion_mor_fkusuario_fkey" FOREIGN KEY ("mor_fkusuario") REFERENCES "usuario"("usr_id") ON DELETE CASCADE ON UPDATE CASCADE;
