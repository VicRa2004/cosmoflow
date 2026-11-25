//! Aviso de versión nueva: consulta el último Release de GitHub al arrancar.
//! shortcut: solo avisa y abre la descarga; actualización automática (Velopack) cuando la app esté firmada.

use std::time::Duration;

use serde::Deserialize;

const ULTIMO_RELEASE: &str = "https://api.github.com/repos/VicRa2004/cosmoflow/releases/latest";

#[derive(Deserialize)]
struct Release {
    tag_name: String,
    html_url: String,
}

pub struct Version {
    pub numero: String,
    pub url: String,
}

/// Bloqueante (llamar en `background_spawn`). `None` si no hay versión nueva o falla la red.
pub fn buscar() -> Option<Version> {
    let agente: ureq::Agent = ureq::Agent::config_builder()
        .timeout_global(Some(Duration::from_secs(10)))
        .build()
        .into();
    let release: Release = agente
        .get(ULTIMO_RELEASE)
        .header("User-Agent", "cosmoflow-desktop")
        .header("Accept", "application/vnd.github+json")
        .call()
        .ok()?
        .body_mut()
        .read_json()
        .ok()?;
    es_mas_nueva(&release.tag_name, env!("CARGO_PKG_VERSION")).then(|| Version {
        numero: release.tag_name.trim_start_matches('v').into(),
        url: release.html_url,
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
    use super::es_mas_nueva;

    #[test]
    fn compara_versiones_numericamente() {
        assert!(es_mas_nueva("v0.10.0", "0.9.3"));
        assert!(es_mas_nueva("v1.0.0", "0.7.1"));
        assert!(!es_mas_nueva("v0.7.1", "0.7.1"));
        assert!(!es_mas_nueva("v0.7.0", "0.7.1"));
        assert!(!es_mas_nueva("v0.8.0-beta", "0.7.1"));
    }
}
