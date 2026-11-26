//! Preferencias locales de este equipo (no van al backend): tamaño de letra, tema y ancho
//! de los paneles. Se guardan en `<config del SO>/cosmoflow/preferencias.json`.

use std::collections::BTreeMap;
use std::path::PathBuf;
use std::rc::Rc;

use gpui_kit::component::{ResizableState, Theme, ThemeMode};
use gpui_kit::{App, Entity, Global, Pixels, Window, px};
use serde::{Deserialize, Serialize};

/// Tamaños de letra que ofrece Configuración → Apariencia (px base del tema).
pub const TAMANOS_LETRA: [(&str, f32); 4] = [
    ("Pequeña", 14.),
    ("Normal", 16.),
    ("Grande", 18.),
    ("Muy grande", 20.),
];
const TAMANO_POR_DEFECTO: f32 = 16.;

/// `None` en el tema = seguir al sistema.
#[derive(Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Tema {
    Claro,
    Oscuro,
}

#[derive(Default, Serialize, Deserialize)]
#[serde(default)]
pub struct Preferencias {
    tamano_letra: Option<f32>,
    tema: Option<Tema>,
    /// Ancho en px del panel con tamaño de cada grupo redimensionable, por id del grupo.
    paneles: BTreeMap<String, f32>,
}
impl Global for Preferencias {}

fn archivo() -> Option<PathBuf> {
    let base = if cfg!(target_os = "windows") {
        std::env::var_os("APPDATA").map(PathBuf::from)
    } else if cfg!(target_os = "macos") {
        std::env::var_os("HOME").map(|h| PathBuf::from(h).join("Library/Application Support"))
    } else {
        std::env::var_os("XDG_CONFIG_HOME")
            .map(PathBuf::from)
            .or_else(|| std::env::var_os("HOME").map(|h| PathBuf::from(h).join(".config")))
    };
    base.map(|b| b.join("cosmoflow").join("preferencias.json"))
}

/// Lee el archivo (un archivo dañado o ausente vale como «todo por defecto») y aplica letra y tema.
pub fn iniciar(cx: &mut App) {
    let prefs: Preferencias = archivo()
        .and_then(|a| std::fs::read_to_string(a).ok())
        .and_then(|t| serde_json::from_str(&t).ok())
        .unwrap_or_default();
    let tema = prefs.tema;
    let tamano = prefs.tamano_letra.unwrap_or(TAMANO_POR_DEFECTO);
    cx.set_global(prefs);
    fijar_tamano_en_temas(tamano, cx);
    aplicar_tema(tema, None, cx);
}

fn guardar(cx: &mut App) {
    let Some(archivo) = archivo() else { return };
    let json = serde_json::to_string_pretty(cx.global::<Preferencias>()).unwrap_or_default();
    let r = archivo
        .parent()
        .map_or(Ok(()), std::fs::create_dir_all)
        .and_then(|()| std::fs::write(&archivo, json));
    // Si no se puede escribir, el cambio vale solo esta sesión; no merece interrumpir.
    if let Err(e) = r {
        eprintln!("No se pudieron guardar las preferencias: {e}");
    }
}

pub fn tamano_letra(cx: &App) -> f32 {
    cx.global::<Preferencias>()
        .tamano_letra
        .filter(|t| TAMANOS_LETRA.iter().any(|(_, v)| v == t))
        .unwrap_or(TAMANO_POR_DEFECTO)
}

/// Lo fija en los temas claro y oscuro para que sobreviva a cambiar de tema.
fn fijar_tamano_en_temas(tamano: f32, cx: &mut App) {
    let tema = Theme::global_mut(cx);
    for config in [&mut tema.light_theme, &mut tema.dark_theme] {
        Rc::make_mut(config).font_size = Some(tamano);
    }
}

pub fn cambiar_tamano_letra(tamano: f32, cx: &mut App) {
    fijar_tamano_en_temas(tamano, cx);
    let modo = Theme::global(cx).mode;
    Theme::change(modo, None, cx);
    cx.global_mut::<Preferencias>().tamano_letra = Some(tamano);
    guardar(cx);
}

pub fn tema(cx: &App) -> Option<Tema> {
    cx.global::<Preferencias>().tema
}

fn aplicar_tema(tema: Option<Tema>, window: Option<&mut Window>, cx: &mut App) {
    match tema {
        None => Theme::sync_system_appearance(window, cx),
        Some(Tema::Claro) => Theme::change(ThemeMode::Light, window, cx),
        Some(Tema::Oscuro) => Theme::change(ThemeMode::Dark, window, cx),
    }
}

pub fn cambiar_tema(tema: Option<Tema>, window: &mut Window, cx: &mut App) {
    aplicar_tema(tema, Some(window), cx);
    cx.global_mut::<Preferencias>().tema = tema;
    guardar(cx);
}

/// Ancho guardado del panel con tamaño del grupo `id`, o `por_defecto`.
pub fn ancho_panel(id: &str, por_defecto: f32, cx: &App) -> Pixels {
    px(cx
        .global::<Preferencias>()
        .paneles
        .get(id)
        .copied()
        .unwrap_or(por_defecto))
}

/// Para `on_resize`: guarda el ancho del panel `indice` del grupo `id` al soltar el divisor.
pub fn guardar_ancho_panel(
    id: &'static str,
    indice: usize,
) -> impl Fn(&Entity<ResizableState>, &mut Window, &mut App) + 'static {
    move |estado, _, cx| {
        let Some(ancho) = estado.read(cx).sizes().get(indice).copied() else {
            return;
        };
        cx.global_mut::<Preferencias>()
            .paneles
            .insert(id.to_string(), f32::from(ancho).round());
        guardar(cx);
    }
}

#[cfg(test)]
mod tests {
    use super::{Preferencias, Tema};

    #[test]
    fn el_json_va_y_vuelve_y_tolera_campos_ausentes() {
        let p: Preferencias = serde_json::from_str("{}").unwrap();
        assert!(p.tema.is_none() && p.tamano_letra.is_none() && p.paneles.is_empty());

        let p: Preferencias =
            serde_json::from_str(r#"{"tema":"oscuro","tamanoLetra":18,"paneles":{"x":400}}"#)
                .unwrap();
        // Las claves van en snake_case: una clave desconocida se ignora sin romper la lectura.
        assert!(p.tema == Some(Tema::Oscuro) && p.tamano_letra.is_none());
        assert_eq!(p.paneles.get("x"), Some(&400.));
    }
}
