-- CreateTable
CREATE TABLE "dispositivo_push" (
    "dpu_id" SERIAL NOT NULL,
    "dpu_fkusuario" INTEGER NOT NULL,
    "dpu_token" VARCHAR(512) NOT NULL,
    "dpu_plataforma" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "dispositivo_push_pkey" PRIMARY KEY ("dpu_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dispositivo_push_dpu_token_key" ON "dispositivo_push"("dpu_token");

-- CreateIndex
CREATE INDEX "dispositivo_push_dpu_fkusuario_idx" ON "dispositivo_push"("dpu_fkusuario");

-- AddForeignKey
ALTER TABLE "dispositivo_push" ADD CONSTRAINT "dispositivo_push_dpu_fkusuario_fkey" FOREIGN KEY ("dpu_fkusuario") REFERENCES "usuario"("usr_id") ON DELETE CASCADE ON UPDATE CASCADE;
