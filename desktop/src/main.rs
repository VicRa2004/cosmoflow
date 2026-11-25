// Sin consola extra en Windows al abrir la app en release.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod api;
mod app;
mod espacio;
mod google;
mod login;
mod modelos;
mod notas;
mod notificaciones;
mod tareas;

use std::sync::Arc;

use gpui_kit::component::{Theme, TitleBar};
use gpui_kit::*;

/// Cliente del backend compartido por todas las vistas.
pub struct ApiGlobal(pub Arc<api::Api>);
impl Global for ApiGlobal {}

pub fn api(cx: &App) -> Arc<api::Api> {
    cx.global::<ApiGlobal>().0.clone()
}

fn main() {
    gpui_kit::application()
        .with_assets(gpui_kit::assets::Assets)
        .run(|cx| {
            gpui_kit::init(cx);
            cx.set_app_identity("com.cosmoflow.desktop", "Cosmoflow");
            cx.set_global(ApiGlobal(api::Api::new()));
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
