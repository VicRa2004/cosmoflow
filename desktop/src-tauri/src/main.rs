// Sin consola extra en Windows al abrir la app en release.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::webview::NewWindowResponse;
use tauri::{Url, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_opener::OpenerExt;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let handle = app.handle().clone();
            WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
                .title("Cosmoflow")
                .inner_size(1280.0, 800.0)
                .min_inner_size(800.0, 600.0)
                // Los enlaces que abren pestaña nueva (target=_blank) van al navegador del sistema.
                .on_new_window(move |url: Url, _| {
                    let _ = handle.opener().open_url(url.as_str(), None::<&str>);
                    NewWindowResponse::Deny
                })
                .build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error al iniciar Cosmoflow");
}
