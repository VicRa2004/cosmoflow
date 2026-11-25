# Reglas de Desktop — Rust + GPUI (Cosmoflow)

> Parte del monorepo Cosmoflow. Para reglas generales del monorepo y convenciones de idioma ver `../AGENTS.md`.

## Qué es

Cliente de escritorio **nativo** en Rust con [GPUI Kit](https://gpui-kit.com) (`gpui-kit`: GPUI de Zed + componentes estilo shadcn, renderizado por GPU). No hay WebView: habla con la API REST del backend igual que la app móvil.

- **Backend:** por defecto `https://cosmoflow.saasil.mx/api`. Para desarrollo local: `COSMOFLOW_API_URL=http://localhost:3000/api pnpm dev:desktop`.
- **Sesión:** cabecera `X-Client-Platform: mobile` (el backend devuelve el refresh token en el cuerpo). El refresh token va al llavero del sistema (`keyring`: Keychain, Credential Manager, Secret Service); el access token solo vive en memoria. Un 401 renueva una vez y reintenta (`src/api.rs`).
- **Google:** redirección a loopback (RFC 8252, `src/google.rs`). La app escucha en `127.0.0.1:<puerto libre>/<nonce>`, abre `/api/auth/google?escritorio=<puerto>-<nonce>` en el navegador y el backend (`GoogleController`) redirige ahí con el refresh token. No hace falta registrar un esquema `cosmoflow://` en el sistema ni tocar la consola de Google.
- Registro, recuperar contraseña y todo lo que aún no es nativo se abre en la web (comando "Abrir en la web").

## Stack

| Pieza | Crate | Por qué |
| --- | --- | --- |
| UI | `gpui-kit` (fijado con `=`) | Una sola dependencia: GPUI + componentes (Sidebar, Command, Input, Dialog, TextView markdown, listas virtuales) + iconos Lucide. |
| HTTP | `ureq` (bloqueante, rustls) | Sin runtime tokio. Se llama siempre dentro de `cx.background_spawn`, nunca en el hilo de la UI. |
| Secretos | `keyring` | Llavero nativo de cada sistema. |
| Enlaces | `open` | Abrir la web en el navegador del sistema. |

## Estructura

```text
desktop/
├── Cargo.toml / Cargo.lock
├── icons/              # iconos para los instaladores
├── fuentes/            # Inter estática (la misma de la web), embebida en el binario
├── .agents/skills/     # gpui-kit y gpui-kit-design-guides (oficiales de longbridge/gpui-kit)
└── src/
    ├── main.rs         # arranque, ventana, ApiGlobal
    ├── api.rs          # cliente HTTP + sesión
    ├── modelos.rs      # DTOs del backend (solo los campos usados)
    ├── app.rs          # raíz: cargando → login → espacio
    ├── login.rs        # login + verificación en dos pasos
    ├── espacio.rs      # sidebar, atajos y paleta de comandos (Ctrl/Cmd+K)
    ├── editor_tarea.rs # editor completo de tareas (panel lateral), reutilizado en Inicio y Organizaciones
    └── <capacidad>.rs  # una vista por capacidad (inicio, tareas, notas/, calendario, organizaciones/, notificaciones, tags, plantillas, perfil)
```

Un archivo (o carpeta) por **capacidad**, no carpetas globales `views/`/`models/`. Si una capacidad crece mucho, pasa a `src/<capacidad>/`.

## Reglas

- **Lee las skills `gpui-kit` (Coding Guides) y `gpui-kit-design-guides` antes de tocar UI.** Nunca inventes una API: busca la firma real en `~/.cargo/registry/src/*/gpui-component-0.11.0/` o `gpui-base-*`.
- Importa `use gpui_kit::component::*; use gpui_kit::*;`. Iconos: `gpui_kit::assets::IconName` (catálogo Lucide completo).
- E/S siempre en `cx.background_spawn`; actualiza la entidad en `this.update(...)` y llama a `cx.notify()` una vez. Estados explícitos de carga, vacío y error en cada vista.
- Errores de acciones → `window.push_notification(Notification::error(..))`; errores de carga → `Alert` en la vista.
- IDs de elementos repetidos con el id de dominio (`("tarea", id)`), nunca con el índice.
- Paridad con móvil: cada pantalla ofrece las mismas opciones que `mobile/lib/modules/<capacidad>` con diseño de escritorio (maestro-detalle, paneles, atajos).
- Atajos: `Ctrl`/`Cmd` + `1`–`6` secciones, `,` perfil, `K` paleta, `N` nueva tarea, `R` recargar (`espacio.rs`). Un comando nuevo va en la paleta y, si es frecuente, con atajo.
- Textos de UI y código en español (ver `../AGENTS.md`).

## Operación

- **Requisitos (Linux):** Rust (rustup) y `sudo apt install gcc g++ clang libfontconfig-dev libwayland-dev libxkbcommon-x11-dev libx11-xcb-dev libssl-dev libzstd-dev libvulkan1` más un driver Vulkan (Mesa). macOS: Xcode. Windows: MSVC + Windows SDK (y opcionalmente Inno Setup 6 para el instalador `.exe`).
- **Dependencias Rust:** `cargo add <crate>@=<versión>` dentro de `desktop/` (versión exacta). `gpui-kit` fija su GPUI; súbelo con cuidado y revisa su changelog.
- **Comandos (desde la raíz):** `pnpm dev:desktop`, `pnpm build:desktop` (compila `--release --locked` y genera los paquetes en `desktop/dist/`), `pnpm --filter desktop check` (fmt + clippy `-D warnings` + tests).
- **Empaquetado (`desktop/scripts/empaquetar.sh`):** se optó por un script nativo (siguiendo `gpui-kit.com/docs/packaging.md`) en lugar de `cargo-packager` para evitar dependencias extra y mantener control directo sobre cada formato:
  - **Linux:** solo `Cosmoflow-<versión>-<uname -m>.AppImage` (con `.desktop` e iconos de `desktop/icons/`). Usa `appimagetool` del PATH, de `$APPIMAGETOOL` o lo descarga del release oficial de AppImage.
  - **macOS:** `.app` (con `CFBundleIdentifier` `com.cosmoflow.desktop` e `icon.icns`) dentro de `.dmg`.
  - **Windows:** `.zip` portable con `cosmoflow.exe` e instalador Inno Setup (`scripts/instalador.iss`, si `ISCC.exe` está disponible). `build.rs` embebe `icons/icon.ico` en el `.exe` usando `rc.exe` del Windows SDK sin crates adicionales.
  - Acepta `--sin-compilar` si el binario ya existe en `target/release/`.
- **CI y releases (`.github/workflows/desktop.yml`):** en `push`/`pull_request` sobre `desktop/**` ejecuta `cargo fmt --check`, `cargo clippy --all-targets --locked -- -D warnings` y `cargo test --locked` en Ubuntu. En tags `v*` valida que `package.json`, `desktop/Cargo.toml` y el tag coinciden, compila y empaqueta en matriz (`ubuntu-24.04`, `macos-15`, `windows-2022`) y adjunta los artefactos al Release de GitHub; también se puede lanzar a mano con `workflow_dispatch`.
- **Versión:** `pnpm version:bump` actualiza también `Cargo.toml`.
- **Actualización automática (`src/actualizaciones.rs`):** al arrancar consulta el último Release; en Linux (AppImage, variable `APPIMAGE`) descarga la nueva y sustituye el archivo, en Windows descarga el instalador y lo ejecuta con `/VERYSILENT` al pulsar «Reiniciar». macOS y copias sin AppImage solo avisan con enlace de descarga. Los nombres de los assets que genera `empaquetar.sh` son el contrato con el actualizador.
- **Recursos (`src/recursos.rs`):** `Assets` de gpui-kit solo trae ~100 iconos; cualquier `IconName` nuevo se añade a `icon_assets!` (un test falla si falta). La fuente es Inter (`fuentes/`, generada del woff2 de la web, licencia OFL).
- La primera compilación tarda (GPUI es grande); las siguientes son incrementales.
