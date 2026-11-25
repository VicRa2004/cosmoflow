#!/usr/bin/env bash
set -euo pipefail

# Empaqueta el binario release de desktop/ en instaladores nativos según la plataforma.
# Uso: bash scripts/empaquetar.sh [--sin-compilar]

SIN_COMPILAR=false
for arg in "$@"; do
  case "$arg" in
    --sin-compilar)
      SIN_COMPILAR=true
      ;;
    *)
      echo "Opción no reconocida: $arg" >&2
      exit 2
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DESKTOP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGET_DIR="${CARGO_TARGET_DIR:-$DESKTOP_DIR/target}"
DIST_DIR="$DESKTOP_DIR/dist"
ICONS_DIR="$DESKTOP_DIR/icons"

VERSION="$(awk '
  /^\[package\]/ { en_paquete = 1; next }
  /^\[/ { en_paquete = 0 }
  en_paquete && /^version[[:space:]]*=/ {
    gsub(/.*=[[:space:]]*"|".*/, "")
    print
    exit
  }
' "$DESKTOP_DIR/Cargo.toml")"

if [ -z "$VERSION" ]; then
  echo "No se pudo leer la versión desde $DESKTOP_DIR/Cargo.toml" >&2
  exit 1
fi

if [ "$SIN_COMPILAR" = false ]; then
  echo "Compilando cosmoflow v$VERSION en modo release..."
  (cd "$DESKTOP_DIR" && cargo build --release --locked)
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

SO="$(uname -s)"
MAQUINA="$(uname -m)"

mapear_arch_generica() {
  case "$1" in
    x86_64|amd64) echo "x64" ;;
    aarch64|arm64) echo "arm64" ;;
    *) echo "$1" ;;
  esac
}

mapear_arch_deb() {
  case "$1" in
    x86_64|amd64) echo "amd64" ;;
    aarch64|arm64) echo "arm64" ;;
    *) echo "$1" ;;
  esac
}

escribir_desktop_entry() {
  local destino="$1"
  local exec_cmd="$2"
  cat > "$destino" <<EOF
[Desktop Entry]
Type=Application
Name=Cosmoflow
Comment=Cliente de escritorio nativo de Cosmoflow
Exec=$exec_cmd
Icon=cosmoflow
Terminal=false
Categories=Office;ProjectManagement;
StartupWMClass=cosmoflow
EOF
  chmod 0644 "$destino"
}

copiar_iconos_hicolor() {
  local base_icons="$1"
  mkdir -p \
    "$base_icons/32x32/apps" \
    "$base_icons/128x128/apps" \
    "$base_icons/256x256/apps" \
    "$base_icons/512x512/apps"

  install -m 0644 "$ICONS_DIR/32x32.png" "$base_icons/32x32/apps/cosmoflow.png"
  install -m 0644 "$ICONS_DIR/128x128.png" "$base_icons/128x128/apps/cosmoflow.png"
  install -m 0644 "$ICONS_DIR/128x128@2x.png" "$base_icons/256x256/apps/cosmoflow.png"
  install -m 0644 "$ICONS_DIR/icon.png" "$base_icons/512x512/apps/cosmoflow.png"
}

empaquetar_linux() {
  local bin="$TARGET_DIR/release/cosmoflow"
  if [ ! -f "$bin" ]; then
    echo "No se encontró el binario en $bin" >&2
    exit 1
  fi

  local arch
  local deb_arch
  arch="$(mapear_arch_generica "$MAQUINA")"
  deb_arch="$(mapear_arch_deb "$MAQUINA")"

  # Tarball portable
  local portable_dir="$TMP_DIR/portable/cosmoflow-$VERSION"
  mkdir -p "$portable_dir/bin" "$portable_dir/share/applications"
  install -m 0755 "$bin" "$portable_dir/bin/cosmoflow"
  escribir_desktop_entry "$portable_dir/share/applications/cosmoflow.desktop" "cosmoflow"
  copiar_iconos_hicolor "$portable_dir/share/icons/hicolor"

  local tarball="$DIST_DIR/cosmoflow-${VERSION}-linux-${arch}.tar.gz"
  tar -czf "$tarball" -C "$TMP_DIR/portable" "cosmoflow-$VERSION"

  # Paquete .deb
  if command -v dpkg-deb >/dev/null 2>&1; then
    local deb_root="$TMP_DIR/deb-root"
    mkdir -p \
      "$deb_root/DEBIAN" \
      "$deb_root/usr/lib/cosmoflow" \
      "$deb_root/usr/bin" \
      "$deb_root/usr/share/applications"

    install -m 0755 "$bin" "$deb_root/usr/lib/cosmoflow/cosmoflow"
    ln -s ../lib/cosmoflow/cosmoflow "$deb_root/usr/bin/cosmoflow"
    escribir_desktop_entry "$deb_root/usr/share/applications/cosmoflow.desktop" "/usr/lib/cosmoflow/cosmoflow"
    copiar_iconos_hicolor "$deb_root/usr/share/icons/hicolor"

    cat > "$deb_root/DEBIAN/control" <<EOF
Package: cosmoflow
Version: $VERSION
Section: utils
Priority: optional
Architecture: $deb_arch
Maintainer: Cosmoflow <soporte@cosmoflow.saasil.mx>
Depends: libvulkan1, libfontconfig1, libxkbcommon-x11-0, libxcb1, libx11-xcb1, libwayland-client0
Description: Cliente de escritorio nativo de Cosmoflow
EOF

    local deb_file="$DIST_DIR/cosmoflow_${VERSION}_${deb_arch}.deb"
    dpkg-deb --root-owner-group --build "$deb_root" "$deb_file"
  else
    echo "Aviso: dpkg-deb no está disponible; se omite el paquete .deb." >&2
  fi
}

empaquetar_macos() {
  local bin="$TARGET_DIR/release/cosmoflow"
  if [ ! -f "$bin" ]; then
    echo "No se encontró el binario en $bin" >&2
    exit 1
  fi

  local arch
  arch="$(mapear_arch_generica "$MAQUINA")"

  local dmg_root="$TMP_DIR/dmg-root"
  local app_dir="$dmg_root/Cosmoflow.app"
  mkdir -p "$app_dir/Contents/MacOS" "$app_dir/Contents/Resources"

  install -m 0755 "$bin" "$app_dir/Contents/MacOS/cosmoflow"
  install -m 0644 "$ICONS_DIR/icon.icns" "$app_dir/Contents/Resources/icon.icns"

  cat > "$app_dir/Contents/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key>
  <string>Cosmoflow</string>
  <key>CFBundleDisplayName</key>
  <string>Cosmoflow</string>
  <key>CFBundleIdentifier</key>
  <string>com.cosmoflow.desktop</string>
  <key>CFBundleExecutable</key>
  <string>cosmoflow</string>
  <key>CFBundleIconFile</key>
  <string>icon.icns</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>$VERSION</string>
  <key>CFBundleVersion</key>
  <string>$VERSION</string>
  <key>NSHighResolutionCapable</key>
  <true/>
</dict>
</plist>
EOF

  plutil -lint "$app_dir/Contents/Info.plist"
  ln -s /Applications "$dmg_root/Applications"

  local dmg_file="$DIST_DIR/Cosmoflow-${VERSION}-macos-${arch}.dmg"
  hdiutil create -volname "Cosmoflow" -srcfolder "$dmg_root" -ov -format UDZO "$dmg_file"
}

empaquetar_windows() {
  local bin="$TARGET_DIR/release/cosmoflow.exe"
  if [ ! -f "$bin" ]; then
    echo "No se encontró el binario en $bin" >&2
    exit 1
  fi

  local arch
  arch="$(mapear_arch_generica "$MAQUINA")"

  local win_stage="$TMP_DIR/windows"
  mkdir -p "$win_stage"
  cp "$bin" "$win_stage/cosmoflow.exe"

  local zip_file="$DIST_DIR/cosmoflow-${VERSION}-windows-${arch}.zip"
  local stage_win
  local zip_win
  stage_win="$(cygpath -w "$win_stage/cosmoflow.exe")"
  zip_win="$(cygpath -w "$zip_file")"

  powershell.exe -NoProfile -NonInteractive -Command \
    "Compress-Archive -Path '$stage_win' -DestinationPath '$zip_win' -Force"

  local iscc=""
  if command -v ISCC.exe >/dev/null 2>&1; then
    iscc="ISCC.exe"
  elif [ -x "/c/Program Files (x86)/Inno Setup 6/ISCC.exe" ]; then
    iscc="/c/Program Files (x86)/Inno Setup 6/ISCC.exe"
  fi

  if [ -n "$iscc" ]; then
    local iss_win
    local exe_win
    local icon_win
    local dist_win
    iss_win="$(cygpath -w "$SCRIPT_DIR/instalador.iss")"
    exe_win="$(cygpath -w "$win_stage/cosmoflow.exe")"
    icon_win="$(cygpath -w "$ICONS_DIR/icon.ico")"
    dist_win="$(cygpath -w "$DIST_DIR")"

    # Sin esto, Git Bash (MSYS) convierte "/DAppVersion=…" en una ruta y ISCC lo toma por otro script.
    MSYS2_ARG_CONV_EXCL='*' "$iscc" \
      "/DAppVersion=$VERSION" \
      "/DAppArch=$arch" \
      "/DExePath=$exe_win" \
      "/DIconPath=$icon_win" \
      "/DOutputDir=$dist_win" \
      "$iss_win"
  else
    echo "Aviso: ISCC.exe (Inno Setup) no está disponible; se omite el instalador .exe." >&2
  fi
}

case "$SO" in
  Linux)
    empaquetar_linux
    ;;
  Darwin)
    empaquetar_macos
    ;;
  MINGW*|MSYS*|CYGWIN*)
    empaquetar_windows
    ;;
  *)
    echo "Plataforma no soportada para empaquetado: $SO" >&2
    exit 1
    ;;
esac

echo "Artefactos generados en $DIST_DIR:"
ls -lh "$DIST_DIR"
