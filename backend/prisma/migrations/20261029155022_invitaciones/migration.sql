-- CreateEnum
CREATE TYPE "estado_invitacion" AS ENUM ('pendiente', 'aceptada', 'rechazada', 'cancelada');

-- CreateTable
CREATE TABLE "invitacion" (
    "inv_id" SERIAL NOT NULL,
    "inv_fkorganizacion" INTEGER NOT NULL,
    "inv_email" VARCHAR(128) NOT NULL,
    "inv_token_hash" VARCHAR(128) NOT NULL,
    "inv_estado" "estado_invitacion" NOT NULL DEFAULT 'pendiente',
    "inv_expira_en" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "invitacion_pkey" PRIMARY KEY ("inv_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invitacion_inv_token_hash_key" ON "invitacion"("inv_token_hash");

-- CreateIndex
CREATE INDEX "invitacion_inv_fkorganizacion_inv_estado_idx" ON "invitacion"("inv_fkorganizacion", "inv_estado");

-- AddForeignKey
ALTER TABLE "invitacion" ADD CONSTRAINT "invitacion_inv_fkorganizacion_fkey" FOREIGN KEY ("inv_fkorganizacion") REFERENCES "organizacion"("org_id") ON DELETE CASCADE ON UPDATE CASCADE;
