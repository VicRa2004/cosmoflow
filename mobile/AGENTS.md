# Reglas de Mobile — Flutter (Cosmoflow)

> Parte del monorepo Cosmoflow. Para reglas generales del monorepo y convenciones de idioma ver `../AGENTS.md`.

## Operación en el Monorepo

- **Aislamiento:** La carpeta `mobile/` es un proyecto Flutter independiente (`pubspec.yaml`). No forma parte de `pnpm-workspace.yaml` y está excluida de Docker en `../.dockerignore`.
- **Dependencias de Dart/Flutter:** Se gestionan dentro de `mobile/` con `flutter pub add <paquete>`.
- **Análisis estático y formato:**
  ```bash
  cd mobile && dart analyze
  cd mobile && dart format .
  ```
- **Tests:**
  ```bash
  cd mobile && flutter test
  ```
- **Ejecución en desarrollo:**
  ```bash
  cd mobile && flutter run
  ```
  - En simulador de iOS, el backend local responde en `http://localhost:3000`.
  - En emulador de Android, el `localhost` del host responde en `http://10.0.2.2:3000`.

---

## Arquitectura y Organización de Archivos (`lib/`)

Espejo de la arquitectura modular de `frontend/src/`, separando la infraestructura compartida (`core/`) de los módulos de dominio (`modules/`):

```text
mobile/lib/
├── core/                           # Base transversal y compartida
│   ├── api/                        # Cliente HTTP (Dio), interceptor JWT + cookie refresh_token y modelos OpenAPI
│   ├── auth/                       # Estado de sesión, almacenamiento seguro (Keychain/Keystore) y permisos efectivos
│   ├── offline/                    # ColaSinConexion (altas de notas y tareas sin red, en SharedPreferences) y AvisoPendientes
│   ├── router/                     # Configuración de GoRouter y guardián de rutas autenticadas
│   ├── theme/                      # Sistema de diseño «Noche índigo» (ThemeData claro/oscuro, tokens de color y tipografía)
│   └── widgets/                    # EstadoCargando/Error/Vacio, confirmar(), ejecutarConAviso(), PaginaEditor, CampoFecha, EditorMarkdown (Crepe de la web en WebView: `assets/editor/`, se regenera con `pnpm build:editor-movil` desde la raíz)
│
├── modules/                        # Lógica de dominio modular (en español)
│   ├── auth/                       # Login, Registro, Recuperar contraseña
│   ├── organizaciones/             # Organizaciones, equipos y proyectos (tareas, notas y tags compartidos; sin administración)
│   ├── tareas/                     # Pendientes y Tareas (personales y compartidas, con responsables y tags)
│   ├── notas/                      # Notas personales y de proyecto: carpetas, lectura/edición markdown
│   ├── tags/                       # Etiquetas personales y de organización
│   └── perfil/                     # Perfil de usuario, seguridad y preferencias
│
└── main.dart                       # Punto de entrada de la aplicación
```

---

## Reglas de Desarrollo en Mobile

### 1. Autenticación (Opción 1A — Compatible con el Backend actual sin cambios)
- El backend entrega `accessToken` en el body JSON (15 min) y `refresh_token` en una cookie `HttpOnly` (`Path=/api/auth`, 7 días).
- El interceptor HTTP (`core/api/`) captura el header `set-cookie` en `/api/auth/login`, `/api/auth/registro` y `/api/auth/refresh`, extrae `refresh_token` y lo persiste de forma segura en `FlutterSecureStorage`.
- Ante un `401`, el interceptor serializa la renovación (una sola petición `/api/auth/refresh` en vuelo enviando `Cookie: refresh_token=...`) y reintenta las peticiones encoladas. Si `/api/auth/refresh` devuelve `401`, limpia la sesión y redirige a `/login`.

### 2. Idioma del Código y Diseño Preventivo
- Seguir la regla de idioma del monorepo (`../AGENTS.md`): **español** para dominio y negocio (`Usuario`, `Tarea`, `Nota`, `obtenerTodos`, `crear`), **inglés** para sufijos técnicos y términos estándar (`Repository`, `Controller`, `State`, `Widget`, `email`, `password`, `token`).
- Mantener los archivos por debajo de **250-300 líneas**, extrayendo widgets de presentación y repositorios/servicios de datos.

### 3. Diseño: identidad web, ergonomía nativa
- **Identidad** de `../frontend/DESIGN.md` («Noche índigo»): un solo acento índigo (acción primaria, foco, selección), bordes de 1px en lugar de sombras, tokens `context.colores` (nunca hex ni `Colors.*` en widgets), claro/oscuro/sistema.
- **Ergonomía** de app nativa, no de escritorio: márgenes 16 dp, áreas táctiles ≥ 48 dp, un solo título por pantalla (en la `AppBar`), acción primaria en FAB, listas como filas, 3–4 destinos en la `NavigationBar`, cada acción en un solo sitio. Detalle completo en la skill **`disenar-pantallas-mobile`**.

### 4. Formularios y modales
- **Pantalla completa con ruta propia** para crear/editar entidades o cualquier campo multilínea (`/<recurso>/nueva`, `/<recurso>/:id/editar`).
- **Diálogo** solo para confirmaciones; **bottom sheet** para acciones rápidas de 1–2 campos.
- El form va en `widgets/<entidad>_form.dart`, separado de la página; si pasa de ~200 líneas se divide por secciones. Toda eliminación pide confirmación.
- Detalle completo en la skill **`disenar-formularios-mobile`**.

### 5. Sin conexión (básico)
- Crear notas y tareas sin red: `NotasApi`/`TareasApi.crear` usan `ColaSinConexion.crearOEncolar`, que devuelve `null` si la guardó en la cola (la página avisa con `avisarSiEncolada` y muestra `avisoPendientes`).
- Si al abrir la app el refresh no llega al servidor (`intentarRefresh` devuelve `null`), `restaurarSesion` entra en **sesión sin conexión** con el último usuario guardado (`SesionStore.sinConexion`, sin token). Un refresh rechazado (401) no entra.
- `main.dart` sincroniza al restaurar la sesión, al volver a primer plano y cada 30 s, de una en una (dos refresh en paralelo revocarían la sesión). Solo se crean offline; editar, borrar y leer necesitan red.
- Cada alta lleva una `Idempotency-Key` propia desde el primer envío y la repite en los reintentos: si el servidor guardó pero la respuesta se perdió, el backend devuelve la misma respuesta y no duplica.

## Skills

En `mobile/.agents/skills/` (enlazadas en `.claude/skills/` con `link-skills` desde la raíz). Propias del proyecto, obligatorias al tocar UI:

- `disenar-pantallas-mobile` — anatomía de pantalla, navegación, listas, estados, medidas.
- `disenar-formularios-mobile` — página vs. bottom sheet vs. diálogo, estructura del form.

Las demás (`flutter-*`, `dart-*`) son genéricas de `flutter/agent-plugins` y otros; ver `skills-lock.json`.
