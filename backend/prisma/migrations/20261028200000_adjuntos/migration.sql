-- CreateTable
CREATE TABLE "adjunto" (
    "adj_id" SERIAL NOT NULL,
    "adj_fkusuario" INTEGER NOT NULL,
    "adj_clave" VARCHAR(255) NOT NULL,
    "adj_tipo" VARCHAR(64) NOT NULL,
    "adj_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adjunto_pkey" PRIMARY KEY ("adj_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "adjunto_adj_clave_key" ON "adjunto"("adj_clave");

-- CreateIndex
CREATE INDEX "adjunto_adj_fkusuario_idx" ON "adjunto"("adj_fkusuario");

-- AddForeignKey
ALTER TABLE "adjunto" ADD CONSTRAINT "adjunto_adj_fkusuario_fkey" FOREIGN KEY ("adj_fkusuario") REFERENCES "usuario"("usr_id") ON DELETE CASCADE ON UPDATE CASCADE;

