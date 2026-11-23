-- AlterTable
ALTER TABLE "notificacion" ADD COLUMN     "ntf_evento" VARCHAR(30),
ADD COLUMN     "ntf_fkactor" INTEGER;

-- AddForeignKey
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_ntf_fkactor_fkey" FOREIGN KEY ("ntf_fkactor") REFERENCES "usuario"("usr_id") ON DELETE SET NULL ON UPDATE CASCADE;
