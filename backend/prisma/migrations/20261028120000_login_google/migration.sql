-- AlterTable
ALTER TABLE "usuario" ADD COLUMN "usr_google_id" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_usr_google_id_key" ON "usuario"("usr_google_id");
