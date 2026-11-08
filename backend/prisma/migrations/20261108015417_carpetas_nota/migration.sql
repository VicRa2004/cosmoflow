-- AlterTable
ALTER TABLE "nota" ADD COLUMN     "not_fkcarpeta" INTEGER;

-- CreateTable
CREATE TABLE "carpeta_nota" (
    "car_id" SERIAL NOT NULL,
    "car_fkusuario" INTEGER NOT NULL,
    "car_nombre" VARCHAR(120) NOT NULL,
    "car_icono" VARCHAR(16),
    "car_color" VARCHAR(7),
    "car_fkpadre" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "car_fkorganizacion" INTEGER,
    "car_fkproyecto" INTEGER,

    CONSTRAINT "carpeta_nota_pkey" PRIMARY KEY ("car_id")
);

-- CreateIndex
CREATE INDEX "carpeta_nota_car_fkusuario_idx" ON "carpeta_nota"("car_fkusuario");

-- CreateIndex
CREATE INDEX "carpeta_nota_car_fkproyecto_idx" ON "carpeta_nota"("car_fkproyecto");

-- CreateIndex
CREATE INDEX "nota_not_fkcarpeta_idx" ON "nota"("not_fkcarpeta");

-- AddForeignKey
ALTER TABLE "nota" ADD CONSTRAINT "nota_not_fkcarpeta_fkey" FOREIGN KEY ("not_fkcarpeta") REFERENCES "carpeta_nota"("car_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carpeta_nota" ADD CONSTRAINT "carpeta_nota_car_fkusuario_fkey" FOREIGN KEY ("car_fkusuario") REFERENCES "usuario"("usr_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carpeta_nota" ADD CONSTRAINT "carpeta_nota_car_fkorganizacion_car_fkproyecto_fkey" FOREIGN KEY ("car_fkorganizacion", "car_fkproyecto") REFERENCES "proyecto"("pry_fkorganizacion", "pry_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carpeta_nota" ADD CONSTRAINT "carpeta_nota_car_fkpadre_fkey" FOREIGN KEY ("car_fkpadre") REFERENCES "carpeta_nota"("car_id") ON DELETE SET NULL ON UPDATE CASCADE;
