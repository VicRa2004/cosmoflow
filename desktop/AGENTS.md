# Reglas de Desktop — Tauri 2 (Cosmoflow)

> Parte del monorepo Cosmoflow. Para reglas generales del monorepo y convenciones de idioma ver `../AGENTS.md`.

## Qué es

Ventana nativa (Tauri 2) que carga la web de producción `https://cosmoflow.saasil.mx`. **No empaqueta el frontend**: la interfaz, la API y la sesión (cookie httpOnly del refresh token, mismo origen) son las de la web, así que la app se actualiza con cada deploy y necesita internet.

- En desarrollo (`pnpm dev:desktop`) carga `http://localhost:5173`: levanta antes `pnpm dev`.
- La web remota **no** tiene acceso a la IPC de Tauri (no hay capabilities `remote`). No añadirlas sin revisar el riesgo: cualquier XSS en la web pasaría a ejecutar comandos nativos.
- Los enlaces que abren pestaña nueva (`target=_blank`) se abren en el navegador del sistema (`src-tauri/src/main.rs`).

## Estructura

```text
desktop/
├── package.json          # solo el CLI de Tauri (@tauri-apps/cli)
└── src-tauri/
    ├── Cargo.toml / Cargo.lock
    ├── tauri.conf.json   # URL que se carga, identificador, targets del instalador
    ├── icons/            # generados con `pnpm --filter desktop tauri icon ../frontend/public/favicon.svg`
    └── src/main.rs       # ventana principal
```

## Operación

- **Requisitos:** Rust (rustup) y, en Linux, `sudo apt install pkg-config libwebkit2gtk-4.1-dev libgtk-3-dev librsvg2-dev libayatana-appindicator3-dev libssl-dev build-essential`.
- **Dependencias JS:** pnpm desde la raíz (`pnpm add -E -D <paquete> --filter desktop`). **Rust:** `cargo add` dentro de `src-tauri/`; plugins de Tauri en la misma versión mayor (2).
- **Comandos (desde la raíz):** `pnpm dev:desktop`, `pnpm build:desktop` (instaladores en `src-tauri/target/release/bundle/`).
- **Chequeo:** `cd desktop/src-tauri && cargo check && cargo clippy`.
- **Versión:** sale del `package.json` raíz (`tauri.conf.json` → `"version": "../../package.json"`); `pnpm version:bump` no necesita tocar nada aquí.
- Cada plataforma se compila en su propio sistema (Windows → `.exe` NSIS, macOS → `.app`/`.dmg`, Linux → AppImage/`.deb`).
