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
│   └── widgets/                    # Primitivas reutilizables (botones, inputs, tarjetas, badges, diálogos)
│
├── modules/                        # Lógica de dominio modular (en español)
│   ├── auth/                       # Login, Registro, Recuperar contraseña
│   ├── tareas/                     # Pendientes y Tareas
│   ├── notas/                      # Notas personales: carpetas (filtrar y asignar), lectura/edición markdown
│   ├── tags/                       # Etiquetas personales
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

### 3. Sistema de Diseño «Noche índigo»
- Seguir las reglas visuales definidas en `../frontend/DESIGN.md`:
  - **Un solo acento:** Índigo (`#4F46E5` / tono 277) reservado para acción primaria, foco, selección e indicador activo.
  - **Superficies y bordes:** Separación mediante bordes finos de `1px` (`BorderSide(width: 1)`) en lugar de sombras de elevación (`elevation: 0` en tarjetas; sombra únicamente en diálogos y menús flotantes).
  - **Radios:** `6px` para controles (botones, inputs, badges) y `8px` para tarjetas y diálogos.
  - **Temas:** Soporte completo para tema claro, oscuro y sistema usando tokens semánticos (`fondo`, `superficie`, `elevada`, `borde`, `tinta`, `tintaSuave`, `tintaTenue`).

### 4. Sin conexión (básico)
- Crear notas y tareas sin red: `NotasApi`/`TareasApi.crear` usan `ColaSinConexion.crearOEncolar`, que devuelve `null` si la guardó en la cola (la página avisa con `avisarSiEncolada` y muestra `avisoPendientes`).
- Si al abrir la app el refresh no llega al servidor (`intentarRefresh` devuelve `null`), `restaurarSesion` entra en **sesión sin conexión** con el último usuario guardado (`SesionStore.sinConexion`, sin token). Un refresh rechazado (401) no entra.
- `main.dart` sincroniza al restaurar la sesión, al volver a primer plano y cada 30 s, de una en una (dos refresh en paralelo revocarían la sesión). Solo se crean offline; editar, borrar y leer necesitan red.
