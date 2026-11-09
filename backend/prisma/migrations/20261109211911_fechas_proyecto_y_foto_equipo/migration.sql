-- AlterTable
ALTER TABLE "equipo" ADD COLUMN     "eq_avatar" VARCHAR(255);

-- AlterTable
ALTER TABLE "proyecto" ADD COLUMN     "pry_fecha_fin" DATE,
ADD COLUMN     "pry_fecha_inicio" DATE;
