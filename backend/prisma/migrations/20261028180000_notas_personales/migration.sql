-- CreateTable
CREATE TABLE "nota" (
    "not_id" SERIAL NOT NULL,
    "not_fkusuario" INTEGER NOT NULL,
    "not_titulo" VARCHAR(255) NOT NULL,
    "not_contenido" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "nota_pkey" PRIMARY KEY ("not_id")
);

-- CreateTable
CREATE TABLE "nota_tag" (
    "ntt_fknota" INTEGER NOT NULL,
    "ntt_fktag" INTEGER NOT NULL,

    CONSTRAINT "nota_tag_pkey" PRIMARY KEY ("ntt_fknota","ntt_fktag")
);

-- CreateIndex
CREATE INDEX "nota_not_fkusuario_updated_at_idx" ON "nota"("not_fkusuario", "updated_at");

-- CreateIndex
CREATE INDEX "nota_tag_ntt_fktag_idx" ON "nota_tag"("ntt_fktag");

-- AddForeignKey
ALTER TABLE "nota" ADD CONSTRAINT "nota_not_fkusuario_fkey" FOREIGN KEY ("not_fkusuario") REFERENCES "usuario"("usr_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_tag" ADD CONSTRAINT "nota_tag_ntt_fknota_fkey" FOREIGN KEY ("ntt_fknota") REFERENCES "nota"("not_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_tag" ADD CONSTRAINT "nota_tag_ntt_fktag_fkey" FOREIGN KEY ("ntt_fktag") REFERENCES "tag"("tag_id") ON DELETE CASCADE ON UPDATE CASCADE;

