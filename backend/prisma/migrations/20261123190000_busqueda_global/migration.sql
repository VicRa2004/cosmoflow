-- Búsqueda global (#52): índices de trigramas para ILIKE '%texto%'
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex
CREATE INDEX "tarea_tar_titulo_idx" ON "tarea" USING GIN ("tar_titulo" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "tarea_tar_contenido_idx" ON "tarea" USING GIN ("tar_contenido" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "nota_not_titulo_idx" ON "nota" USING GIN ("not_titulo" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "nota_not_contenido_idx" ON "nota" USING GIN ("not_contenido" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "equipo_eq_nombre_idx" ON "equipo" USING GIN ("eq_nombre" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "proyecto_pry_nombre_idx" ON "proyecto" USING GIN ("pry_nombre" gin_trgm_ops);
