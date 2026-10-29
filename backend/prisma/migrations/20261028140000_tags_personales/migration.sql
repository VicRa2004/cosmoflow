-- CreateTable
CREATE TABLE "tag" (
    "tag_id" SERIAL NOT NULL,
    "tag_fkusuario" INTEGER NOT NULL,
    "tag_nombre" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tag_pkey" PRIMARY KEY ("tag_id")
);

-- CreateIndex
CREATE INDEX "tag_tag_fkusuario_idx" ON "tag"("tag_fkusuario");

-- AddForeignKey
ALTER TABLE "tag" ADD CONSTRAINT "tag_tag_fkusuario_fkey" FOREIGN KEY ("tag_fkusuario") REFERENCES "usuario"("usr_id") ON DELETE CASCADE ON UPDATE CASCADE;

