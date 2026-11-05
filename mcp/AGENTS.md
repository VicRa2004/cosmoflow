# Reglas del servidor MCP (Cosmoflow)

> Parte del monorepo Cosmoflow. Para reglas de workspaces, instalación y lint ver `../AGENTS.md`.

Controla Cosmoflow desde una IA. Corre en la máquina del usuario por **stdio** y consume la API REST con un token personal.

## Reglas

- **Solo la API REST:** sin Prisma ni imports de `backend/`. Los permisos los aplica la API; este paquete no decide nada de acceso.
- **stdout es del protocolo:** ningún `console.log`. Los mensajes van por stderr.
- **El token no sale de `api.ts`:** ni en logs ni en resultados de herramientas.
- **Errores de la API:** se devuelven con `isError: true`, para que la IA los lea (ver `resultado` en `herramientas.ts`).
- **Herramienta nueva:** añadirla en `herramientas.ts` y a la prueba de `backend/src/test/mcp.e2e.spec.ts`.
- **Dependencias:** desde la raíz, `pnpm add -E <paquete> --filter mcp`.

## Conectarlo a Claude Code

1. Crea un token en Cosmoflow: **Mi perfil → Tokens personales**. Se muestra una sola vez.
2. Registra el servidor. `COSMOFLOW_URL` debe usar https, salvo en localhost:

   ```bash
   claude mcp add cosmoflow \
     --env COSMOFLOW_URL=https://tu-dominio \
     --env COSMOFLOW_TOKEN=cfp_tu_token \
     -- bun /ruta/a/cosmoflow/mcp/src/index.ts
   ```

3. En Claude Code, `/mcp` debe mostrar `cosmoflow` conectado.

Antes hay que ejecutar `pnpm install` en la raíz. El token tiene los mismos permisos que tu usuario: revócalo desde el perfil si se filtra o dejas de usarlo. Revocarlo tiene efecto inmediato.

## Herramientas

| Herramienta | Qué hace |
|---|---|
| `listar_pendientes` | Tareas pendientes y en progreso, personales y en las que eres responsable |
| `crear_tarea` | Crea una tarea personal |
| `completar_tarea` | Marca una tarea como completada |
| `buscar_notas` | Busca en las notas personales |
| `crear_nota` | Crea una nota personal |

## Pruebas

- `pnpm test:mcp`: cliente de la API, sin red.
- `pnpm test:e2e`: arranca este servidor por stdio contra la API y una BD reales (`backend/src/test/mcp.e2e.spec.ts`).
