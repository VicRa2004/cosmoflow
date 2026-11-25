//! Actualización automática desde el último Release de GitHub.
//!
//! - Linux (AppImage): descarga la nueva `.AppImage` junto a la actual y la sustituye; al
//!   reiniciar ya arranca la nueva.
//! - Windows: descarga el instalador de Inno Setup y, al reiniciar, lo ejecuta en silencio
//!   (reabre la app al terminar).
//! - macOS o una copia que no sabe sustituirse (tarball, `cargo run`): solo avisa y abre la descarga.
//!
//! shortcut: la integridad se apoya en HTTPS + tamaño del asset; firmar los binarios si se distribuye fuera de GitHub.

use std::io;
use std::path::{Path, PathBuf};
use std::time::Duration;

use serde::Deserialize;

const ULTIMO_RELEASE: &str = "https://api.github.com/repos/VicRa2004/cosmoflow/releases/latest";

#[derive(Deserialize)]
struct Release {
    tag_name: String,
    html_url: String,
    #[serde(default)]
    assets: Vec<Asset>,
}

#[derive(Deserialize, Clone)]
struct Asset {
    name: String,
    browser_download_url: String,
    size: u64,
}

pub struct Version {
    pub numero: String,
    /// Página del release, para descargar a mano si no se puede instalar sola.
    pub url: String,
    asset: Option<Asset>,
}

/// Lo que queda pendiente tras descargar: qué hacer al pulsar «Reiniciar».
pub enum Instalada {
    /// La AppImage ya está sustituida; basta con relanzarla.
    AppImage(PathBuf),
    /// Instalador descargado; se ejecuta en silencio al reiniciar.
    Instalador(PathBuf),
}

fn agente() -> ureq::Agent {
    ureq::Agent::config_builder()
        .timeout_connect(Some(Duration::from_secs(10)))
        .build()
        .into()
}

/// Bloqueante (llamar en `background_spawn`). `None` si no hay versión nueva o falla la red.
pub fn buscar() -> Option<Version> {
    let release: Release = agente()
        .get(ULTIMO_RELEASE)
        .header("User-Agent", "cosmoflow-desktop")
        .header("Accept", "application/vnd.github+json")
        .config()
        .timeout_global(Some(Duration::from_secs(15)))
        .build()
        .call()
        .ok()?
        .body_mut()
        .read_json()
        .ok()?;
    if !es_mas_nueva(&release.tag_name, env!("CARGO_PKG_VERSION")) {
        return None;
    }
    let asset = elegir_asset(
        &release.assets,
        std::env::consts::OS,
        std::env::consts::ARCH,
    )
    .cloned();
    Some(Version {
        numero: release.tag_name.trim_start_matches('v').into(),
        url: release.html_url,
        asset,
    })
}

/// Bloqueante. `Ok(None)` si esta copia no sabe actualizarse sola (hay que descargar a mano).
pub fn descargar_e_instalar(version: &Version) -> Result<Option<Instalada>, String> {
    let Some(asset) = &version.asset else {
        return Ok(None);
    };
    if cfg!(target_os = "linux") {
        // `APPIMAGE` lo define el runtime de AppImage con la ruta del archivo en ejecución.
        let Some(actual) = std::env::var_os("APPIMAGE").map(PathBuf::from) else {
            return Ok(None);
        };
        // Misma carpeta para que el `rename` sea atómico (mismo sistema de archivos).
        let temporal = actual.with_extension("AppImage.descarga");
        descargar(asset, &temporal)?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&temporal, std::fs::Permissions::from_mode(0o755))
                .map_err(|e| e.to_string())?;
        }
        // Linux permite sustituir el archivo en uso: el proceso actual conserva el inodo viejo.
        std::fs::rename(&temporal, &actual).map_err(|e| {
            let _ = std::fs::remove_file(&temporal);
            format!("no se pudo sustituir {}: {e}", actual.display())
        })?;
        Ok(Some(Instalada::AppImage(actual)))
    } else if cfg!(target_os = "windows") {
        let destino = std::env::temp_dir().join(&asset.name);
        descargar(asset, &destino)?;
        Ok(Some(Instalada::Instalador(destino)))
    } else {
        Ok(None)
    }
}

/// Lanza la versión nueva; quien llama cierra la app justo después.
pub fn reiniciar(instalada: &Instalada) -> io::Result<()> {
    match instalada {
        Instalada::AppImage(ruta) => std::process::Command::new(ruta).spawn().map(drop),
        // `/CLOSEAPPLICATIONS` espera a que esta instancia se cierre; el `[Run]` silencioso
        // de `instalador.iss` vuelve a abrirla al terminar.
        Instalada::Instalador(ruta) => std::process::Command::new(ruta)
            .args([
                "/VERYSILENT",
                "/SUPPRESSMSGBOXES",
                "/NORESTART",
                "/CLOSEAPPLICATIONS",
            ])
            .spawn()
            .map(drop),
    }
}

fn descargar(asset: &Asset, destino: &Path) -> Result<(), String> {
    let respuesta = agente()
        .get(&asset.browser_download_url)
        .header("User-Agent", "cosmoflow-desktop")
        .call()
        .map_err(|e| e.to_string())?;
    let mut archivo = std::fs::File::create(destino).map_err(|e| e.to_string())?;
    let copiados =
        io::copy(&mut respuesta.into_body().into_reader(), &mut archivo).map_err(|e| e.to_string());
    drop(archivo);
    let error = match copiados {
        Ok(n) if n == asset.size => return Ok(()),
        Ok(n) => format!("descarga incompleta ({n} de {} bytes)", asset.size),
        Err(e) => e,
    };
    let _ = std::fs::remove_file(destino);
    Err(error)
}

/// El paquete que esta plataforma sabe instalar sola (los nombres los fija `empaquetar.sh`).
fn elegir_asset<'a>(assets: &'a [Asset], so: &str, arch: &str) -> Option<&'a Asset> {
    assets.iter().find(|a| match so {
        "linux" => a.name.ends_with(&format!("-{arch}.AppImage")),
        "windows" => a.name.ends_with("-setup.exe"),
        _ => false,
    })
}

/// Compara `vX.Y.Z` con la versión actual; las etiquetas no numéricas nunca son más nuevas.
fn es_mas_nueva(etiqueta: &str, actual: &str) -> bool {
    let partes = |s: &str| -> Option<Vec<u64>> {
        s.trim_start_matches('v')
            .split('.')
            .map(|p| p.parse().ok())
            .collect()
    };
    matches!((partes(etiqueta), partes(actual)), (Some(a), Some(b)) if a > b)
}

#[cfg(test)]
mod tests {
    use super::{Asset, elegir_asset, es_mas_nueva};

    #[test]
    fn compara_versiones_numericamente() {
        assert!(es_mas_nueva("v0.10.0", "0.9.3"));
        assert!(es_mas_nueva("v1.0.0", "0.7.1"));
        assert!(!es_mas_nueva("v0.7.1", "0.7.1"));
        assert!(!es_mas_nueva("v0.7.0", "0.7.1"));
        assert!(!es_mas_nueva("v0.8.0-beta", "0.7.1"));
    }

    #[test]
    fn elige_el_paquete_de_cada_plataforma() {
        let asset = |name: &str| Asset {
            name: name.into(),
            browser_download_url: String::new(),
            size: 1,
        };
        let assets = [
            asset("Cosmoflow-0.9.0-macos-arm64.dmg"),
            asset("cosmoflow-0.9.0-windows-x64.zip"),
            asset("cosmoflow-0.9.0-windows-x64-setup.exe"),
            asset("Cosmoflow-0.9.0-x86_64.AppImage"),
        ];
        let nombre = |so, arch| elegir_asset(&assets, so, arch).map(|a| a.name.as_str());
        assert_eq!(
            nombre("linux", "x86_64"),
            Some("Cosmoflow-0.9.0-x86_64.AppImage")
        );
        assert_eq!(nombre("linux", "aarch64"), None);
        assert_eq!(
            nombre("windows", "x86_64"),
            Some("cosmoflow-0.9.0-windows-x64-setup.exe")
        );
        assert_eq!(nombre("macos", "aarch64"), None);
    }
}
