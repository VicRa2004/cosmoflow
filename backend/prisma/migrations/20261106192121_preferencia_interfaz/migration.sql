-- CreateTable
CREATE TABLE "preferencia_interfaz" (
    "pin_fkusuario" INTEGER NOT NULL,
    "pin_datos" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "preferencia_interfaz_pkey" PRIMARY KEY ("pin_fkusuario")
);

-- AddForeignKey
ALTER TABLE "preferencia_interfaz" ADD CONSTRAINT "preferencia_interfaz_pin_fkusuario_fkey" FOREIGN KEY ("pin_fkusuario") REFERENCES "usuario"("usr_id") ON DELETE CASCADE ON UPDATE CASCADE;
