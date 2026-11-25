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
├── .agents/skills/     # gpui-kit y gpui-kit-design-guides (oficiales de longbridge/gpui-kit)
└── src/
    ├── main.rs         # arranque, ventana, ApiGlobal
    ├── api.rs          # cliente HTTP + sesión
    ├── modelos.rs      # DTOs del backend (solo los campos usados)
    ├── app.rs          # raíz: cargando → login → espacio
    ├── login.rs        # login + verificación en dos pasos
    ├── espacio.rs      # sidebar, atajos y paleta de comandos (Ctrl/Cmd+K)
    └── <capacidad>.rs  # una vista por capacidad: tareas, notas, notificaciones
```

Un archivo (o carpeta) por **capacidad**, no carpetas globales `views/`/`models/`. Si una capacidad crece mucho, pasa a `src/<capacidad>/`.

## Reglas

- **Lee las skills `gpui-kit` (Coding Guides) y `gpui-kit-design-guides` antes de tocar UI.** Nunca inventes una API: busca la firma real en `~/.cargo/registry/src/*/gpui-component-0.11.0/` o `gpui-base-*`.
- Importa `use gpui_kit::component::*; use gpui_kit::*;`. Iconos: `gpui_kit::assets::IconName` (catálogo Lucide completo).
- E/S siempre en `cx.background_spawn`; actualiza la entidad en `this.update(...)` y llama a `cx.notify()` una vez. Estados explícitos de carga, vacío y error en cada vista.
- Errores de acciones → `window.push_notification(Notification::error(..))`; errores de carga → `Alert` en la vista.
- IDs de elementos repetidos con el id de dominio (`("tarea", id)`), nunca con el índice.
- Atajos: `Ctrl`/`Cmd` + `1/2/3` secciones, `K` paleta, `N` nueva tarea, `R` recargar (`espacio.rs`). Un comando nuevo va en la paleta y, si es frecuente, con atajo.
- Textos de UI y código en español (ver `../AGENTS.md`).

## Operación

- **Requisitos (Linux):** Rust (rustup) y `sudo apt install gcc g++ clang libfontconfig-dev libwayland-dev libxkbcommon-x11-dev libx11-xcb-dev libssl-dev libzstd-dev libvulkan1` más un driver Vulkan (Mesa). macOS: Xcode. Windows: MSVC + Windows SDK.
- **Dependencias Rust:** `cargo add <crate>@=<versión>` dentro de `desktop/` (versión exacta). `gpui-kit` fija su GPUI; súbelo con cuidado y revisa su changelog.
- **Comandos (desde la raíz):** `pnpm dev:desktop`, `pnpm build:desktop` (binario en `desktop/target/release/cosmoflow`), `pnpm --filter desktop check` (fmt + clippy `-D warnings` + tests).
- **Versión:** `pnpm version:bump` actualiza también `Cargo.toml`.
- La primera compilación tarda (GPUI es grande); las siguientes son incrementales.
