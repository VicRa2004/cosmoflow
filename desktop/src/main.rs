// Sin consola extra en Windows al abrir la app en release.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod actualizaciones;
mod api;
mod app;
mod calendario;
mod editor_tarea;
mod espacio;
mod google;
mod inicio;
mod login;
mod modelos;
mod monitoreo;
mod notas;
mod notificaciones;
mod organizaciones;
mod perfil;
mod plantillas;
mod recursos;
mod tags;
mod tareas;

use std::rc::Rc;
use std::sync::Arc;

use gpui_kit::component::{Theme, ThemeSet, TitleBar};
use gpui_kit::*;

/// Cliente del backend compartido por todas las vistas.
pub struct ApiGlobal(pub Arc<api::Api>);
impl Global for ApiGlobal {}

pub fn api(cx: &App) -> Arc<api::Api> {
    cx.global::<ApiGlobal>().0.clone()
}

/// Tema «Noche índigo» de la marca (misma paleta que `mobile/lib/core/theme/`), claro y oscuro.
fn tema() -> ThemeSet {
    serde_json::from_str(include_str!("../tema.json")).expect("tema.json inválido")
}

/// Registra los dos modos; `sync_system_appearance` elige según el sistema.
fn aplicar_tema(cx: &mut App) {
    let global = Theme::global_mut(cx);
    for config in tema().themes {
        if config.mode.is_dark() {
            global.dark_theme = Rc::new(config);
        } else {
            global.light_theme = Rc::new(config);
        }
    }
}

fn main() {
    let _monitoreo = monitoreo::iniciar();
    gpui_kit::application()
        .with_assets(recursos::Recursos)
        .run(|cx| {
            gpui_kit::init(cx);
            recursos::registrar_fuentes(cx);
            cx.set_app_identity("com.cosmoflow.desktop", "Cosmoflow");
            cx.set_global(ApiGlobal(api::Api::new()));
            aplicar_tema(cx);
            Theme::sync_system_appearance(None, cx);
            espacio::registrar_atajos(cx);
            notas::registrar_atajos(cx);
            cx.on_window_closed(|cx, _| cx.quit()).detach();

            let opciones = WindowOptions {
                window_bounds: Some(WindowBounds::centered(None, size(px(1280.), px(800.)), cx)),
                window_min_size: Some(size(px(800.), px(560.))),
                app_id: Some("com.cosmoflow.desktop".into()),
                ..TitleBar::window_options()
            };
            gpui_kit::open_window(opciones, cx, |window, cx| {
                cx.new(|cx| app::CosmoflowApp::new(window, cx))
            })
            .expect("no se pudo abrir la ventana");
            cx.activate(true);
        });
}

#[cfg(test)]
mod tests {
    #[test]
    fn el_tema_tiene_modo_claro_y_oscuro() {
        let modos: Vec<bool> = super::tema()
            .themes
            .iter()
            .map(|t| t.mode.is_dark())
            .collect();
        assert_eq!(modos.len(), 2);
        assert!(modos.contains(&true) && modos.contains(&false));
    }
}
