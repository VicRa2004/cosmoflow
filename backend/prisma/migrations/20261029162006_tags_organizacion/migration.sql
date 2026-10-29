-- AlterTable
ALTER TABLE "tag" ADD COLUMN     "tag_fkorganizacion" INTEGER,
ALTER COLUMN "tag_fkusuario" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "tag_tag_fkorganizacion_idx" ON "tag"("tag_fkorganizacion");

-- AddForeignKey
ALTER TABLE "tag" ADD CONSTRAINT "tag_tag_fkorganizacion_fkey" FOREIGN KEY ("tag_fkorganizacion") REFERENCES "organizacion"("org_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RN-60: un tag es de un usuario o de una organización, nunca de los dos ni de ninguno.
ALTER TABLE "tag" ADD CONSTRAINT "tag_un_solo_dueno"
  CHECK (("tag_fkusuario" IS NULL) <> ("tag_fkorganizacion" IS NULL));
