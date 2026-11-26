# Respaldos

El repo no hace respaldos: los gestiona **Dokploy** en producción y se guardan en la nube, fuera del servidor.

| Qué | Dónde se configura |
|---|---|
| PostgreSQL (servicio aparte de Dokploy, ver ADR [0004](decisions/0004-un-solo-contenedor-dokploy.md)) | Dokploy → base de datos → *Backups* |
| Volúmenes (`uploads`, si no se usa S3) | Dokploy → aplicación → *Volume Backups* |
| VPS completo | Panel del proveedor del VPS |

Frecuencia, retención y destino se ajustan ahí, no en el repo.

## Cómo están guardados

- **Destino:** Google Drive, carpeta `dokploy-backups`, **cifrada con rclone `crypt`** (nombres y contenido). En Drive solo se ven nombres ilegibles.
- **Frecuencia:** diaria a las 03:00 UTC. Cada noche crea `backups/localhost/AAAA-MM-DD_0300/` con un respaldo de todo el servidor, no solo de Cosmoflow.
- **Retención:** 14 días.
- **Cosmoflow** dentro de cada carpeta:
  - BD: `cosmoflow-db-<id>.sql.gz`, un `pg_dumpall` (roles + base `cosmoflow`), PostgreSQL 18.
  - Archivos: `volumes/cosmoflow-app-<id>_uploads.tar.gz` (`avatares/`, `adjuntos/`).
- **Clave de cifrado:** la contraseña y el *salt* del remoto `crypt` van en el gestor de contraseñas, **no solo en el VPS**. Sin ellos los respaldos no se pueden leer; si el VPS se pierde y la clave solo estaba allí, se pierden también los respaldos.

## Restaurar

- **Base de datos:** desde *Backups* en Dokploy, elegir el respaldo y restaurarlo sobre el servicio de PostgreSQL. Después, reiniciar `app` para que el servicio `migrate` aplique las migraciones que falten.
- **`uploads`:** restaurar el respaldo del volumen desde Dokploy con `app` detenida.
- **Servidor caído:** recrear el VPS desde su snapshot, o montar uno nuevo con Dokploy y restaurar BD y volumen como arriba. Si Dokploy no está disponible, los archivos se sacan de Drive con rclone (ver abajo).

Si se añade un volumen o una base de datos nueva al despliegue, hay que darle también su respaldo en Dokploy.

## Probar un respaldo sin tocar producción

Requiere un `~/.config/rclone/rclone.conf` local (permisos `600`) con el remoto de Drive y el `crypt` encima, con la misma contraseña, el mismo salt y el mismo `remote =` que el VPS.

```bash
rclone lsf gdrive-crypt:backups/localhost/                     # días disponibles
D=gdrive-crypt:backups/localhost/AAAA-MM-DD_0300
rclone copy $D ./restore --include 'cosmoflow-db-*.sql.gz' --include 'volumes/cosmoflow-app-*_uploads.tar.gz'

# BD en un Postgres desechable (no el de desarrollo: el dump trae roles)
docker run -d --rm --name restore-test -e POSTGRES_PASSWORD=test postgres:18
zcat restore/cosmoflow-db-*.sql.gz | docker exec -i restore-test psql -U postgres -q
docker exec restore-test psql -U postgres -d cosmoflow -c \
  "select migration_name from _prisma_migrations order by finished_at desc limit 1"

# Archivos: cada adj_clave / usr_avatar de la BD debe existir en el tar
tar -xzf restore/volumes/cosmoflow-app-*_uploads.tar.gz -C restore/uploads

docker stop restore-test && rm -rf restore   # contiene datos reales
```

Última prueba: 2026-11-26, con el respaldo de ese día. Restauró sin errores, con 48 migraciones (la última `20261124022923_dos_pasos`, igual que el repo) y datos hasta 1 h antes del respaldo. Los 3 archivos de `uploads` referenciados en la BD estaban presentes e íntegros.
