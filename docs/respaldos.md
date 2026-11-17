# Respaldos

El repo no hace respaldos: los gestiona **Dokploy** en producción y se guardan en la nube, fuera del servidor.

| Qué | Dónde se configura |
|---|---|
| PostgreSQL (servicio aparte de Dokploy, ver ADR [0004](decisions/0004-un-solo-contenedor-dokploy.md)) | Dokploy → base de datos → *Backups* |
| Volúmenes (`uploads`, si no se usa S3) | Dokploy → aplicación → *Volume Backups* |
| VPS completo | Panel del proveedor del VPS |

Frecuencia, retención y destino se ajustan ahí, no en el repo.

## Restaurar

- **Base de datos:** desde *Backups* en Dokploy, elegir el respaldo y restaurarlo sobre el servicio de PostgreSQL. Después, reiniciar `app` para que el servicio `migrate` aplique las migraciones que falten.
- **`uploads`:** restaurar el respaldo del volumen desde Dokploy con `app` detenida.
- **Servidor caído:** recrear el VPS desde su snapshot, o montar uno nuevo con Dokploy y restaurar BD y volumen como arriba.

Si se añade un volumen o una base de datos nueva al despliegue, hay que darle también su respaldo en Dokploy.
