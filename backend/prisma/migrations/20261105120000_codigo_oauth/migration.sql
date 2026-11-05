-- CreateTable
CREATE TABLE "codigo_oauth" (
    "cdo_id" SERIAL NOT NULL,
    "cdo_codigo_hash" VARCHAR(128) NOT NULL,
    "cdo_fkusuario" INTEGER NOT NULL,
    "cdo_client_id" VARCHAR(255) NOT NULL,
    "cdo_redirect_uri" VARCHAR(2048) NOT NULL,
    "cdo_code_challenge" VARCHAR(128) NOT NULL,
    "cdo_expira_en" TIMESTAMP(3) NOT NULL,
    "cdo_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "codigo_oauth_pkey" PRIMARY KEY ("cdo_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "codigo_oauth_cdo_codigo_hash_key" ON "codigo_oauth"("cdo_codigo_hash");

-- CreateIndex
CREATE INDEX "codigo_oauth_cdo_fkusuario_idx" ON "codigo_oauth"("cdo_fkusuario");

-- CreateIndex
CREATE INDEX "codigo_oauth_cdo_expira_en_idx" ON "codigo_oauth"("cdo_expira_en");

-- AddForeignKey
ALTER TABLE "codigo_oauth" ADD CONSTRAINT "codigo_oauth_cdo_fkusuario_fkey" FOREIGN KEY ("cdo_fkusuario") REFERENCES "usuario"("usr_id") ON DELETE CASCADE ON UPDATE CASCADE;
