# 0007 — Chats dentro de organizaciones, equipos y proyectos

**Estado:** aceptada.

## Contexto

Los miembros de una organización solo se comunican fuera de la app. Se quiere conversar dentro de las organizaciones y sus equipos.

Lo que ya existe y condiciona el diseño:

- **Visibilidad (RN-23):** quién ve las tareas de una organización, equipo o proyecto ya está resuelto (`useMiembrosDestino` en la web, `ContextosTarea` en el backend). Un chat debería tener exactamente esos mismos miembros.
- **Menciones:** el markdown ya usa `[@Ana](mencion:12)` (`extraerMenciones` en `Tarea.ts`), y `notificacion` avisa de `mencion` por correo, Telegram y móvil.
- **Adjuntos:** módulo `adjunto`, con almacenamiento local o S3.
- **Eventos:** el bus activo es `eventos-outbox`, que entrega **cada 2 s**. Sirve para auditoría y notificaciones, pero no para que un mensaje aparezca al instante.
- **Despliegue:** un solo contenedor y una réplica (ADR [0004](0004-un-solo-contenedor-dokploy.md), [escalado](../escalado.md)).
- **Tareas relacionadas en Cosmoflow:** comentarios en tareas (#50) y actualizaciones en tiempo real por SSE (#59), que la #50 marca como requisitos previos de los chats.

## Decisión

### Alcance de la primera versión

- **Un canal por sitio, sin crearlos a mano:** «General» de la organización, uno por equipo y uno por proyecto. Sus miembros son quienes ven ese sitio (RN-23): no hay que invitar ni sincronizar membresías, y al salir del equipo u organización se deja de ver el canal.
- Mensajes en Markdown con menciones y adjuntos, reutilizando lo que ya existe. El autor puede editar y borrar los suyos (borrado lógico).
- **Fuera de la primera versión:** mensajes directos, hilos, reacciones, canales creados a mano y búsqueda en mensajes. Se añaden si se echan en falta.

### Modelo

- `Canal` (`can_`): `organizacionId` y, como mucho, uno de `equipoId` o `proyectoId`. Único por sitio. Se crea en el primer mensaje (upsert) y desaparece en cascada con su equipo o proyecto.
- `Mensaje` (`men_`): `canalId`, `autorId`, `contenido`, `createdAt`, `editadoEn`, `deletedAt`. Índice `(canalId, id)`.
- `LecturaCanal` (`lec_`): `(usuarioId, canalId)` → `ultimoLeidoId`, para los no leídos sin contar fila por fila.
- **Paginación por cursor** (`?antesDe=<id>&limite=50`), no por página: los mensajes nuevos desplazarían las páginas.
- `extraerMenciones` pasa a `core/shared/domain/` para usarlo en tareas, comentarios (#50) y mensajes.

### Tiempo real

- Usa el canal SSE por usuario de la #59. **Se envía con `POST`**: no hace falta WebSocket.
- **No pasa por el outbox:** tras confirmar la transacción, el caso de uso entrega `MensajeCreado` directamente al emisor SSE, que lo reparte entre las conexiones abiertas de quienes ven el canal. El evento sí va también al outbox, para la auditoría y las notificaciones.
- **Con N réplicas:** `LISTEN/NOTIFY` de PostgreSQL entre réplicas, sin infraestructura nueva. Hay que añadir la fila correspondiente a `docs/escalado.md`.

### Notificaciones

- **No se avisa por cada mensaje** por correo, Telegram ni push: hay contador de no leídos en la web y en la app.
- Las menciones en un mensaje usan el evento `mencion` que ya existe, con sus preferencias por canal.

### Permisos

- Leer y escribir: cualquiera que vea el sitio.
- Borrar mensajes ajenos: permiso nuevo `chats:moderar` en `PERMISOS_ORGANIZACION` (el administrador ya lo tiene, como todos).
- Los mensajes de quien sale de la organización se conservan, con su nombre.

### Orden

1. **#50 Comentarios en tareas:** fija el patrón de markdown, menciones, edición y borrado que luego reutiliza el chat.
2. **#59 SSE:** el canal de tiempo real.
3. **Chat:** backend (módulo `chat`), web (panel por organización, equipo o proyecto con los no leídos) y, después, mobile y herramientas MCP (`listar_mensajes`, `enviar_mensaje`).

## Alternativas descartadas

- **Servicio externo (Matrix, Rocket.Chat, Mattermost):** sería otro servicio en Dokploy con su propia autenticación y membresías que habría que sincronizar con organizaciones y equipos. Choca con [0004](0004-un-solo-contenedor-dokploy.md).
- **Integrar Slack o Discord:** saca la conversación de la app y obliga a cada organización a tener una cuenta allí.
- **WebSocket:** solo aporta enviar por el mismo socket. Con SSE (#59) y `POST` basta, y los proxys y la app móvil lo manejan con menos problemas.
- **Mensajes por el outbox:** hasta 2 s de retraso por mensaje.
- **Una sola tabla para comentarios de tarea y mensajes:** mezcla dos ciclos de vida (los comentarios se borran con la tarea y van en el historial de actividad). Se comparte la lógica (menciones, markdown), no la tabla.

## Consecuencias

- No hay que gestionar membresías: el chat hereda las reglas de visibilidad ya probadas. A cambio, no hay canales privados dentro de un equipo.
- Las conexiones SSE abiertas consumen memoria en la réplica única. Hay que vigilarlo cuando crezcan los usuarios concurrentes.
- Los mensajes no se purgan en la primera versión. Si crecen, conviene una retención por organización junto con la papelera (#48).
