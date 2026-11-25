//! Raíz de la ventana: decide entre login y espacio de trabajo según la sesión.

use gpui_kit::component::*;
use gpui_kit::component::{
    ActiveTheme, TitleBar,
    button::{Button, ButtonVariants as _},
    notification::Notification,
    spinner::Spinner,
};
use gpui_kit::prelude::FluentBuilder as _;
use gpui_kit::*;

use crate::espacio::{Espacio, EventoEspacio};
use crate::login::{Autenticado, LoginView};
use crate::modelos::Usuario;

enum Pantalla {
    Cargando,
    Login(Entity<LoginView>),
    Espacio(Entity<Espacio>),
}

pub struct CosmoflowApp {
    pantalla: Pantalla,
    _suscripcion: Option<Subscription>,
}

impl CosmoflowApp {
    pub fn new(window: &mut Window, cx: &mut Context<Self>) -> Self {
        let api = crate::api(cx);
        cx.spawn_in(window, async move |this, cx| {
            let sesion = cx.background_spawn(async move { api.restaurar() }).await;
            this.update_in(cx, |this, window, cx| match sesion {
                Ok(usuario) => this.mostrar_espacio(usuario, window, cx),
                Err(_) => this.mostrar_login(window, cx),
            })
            .ok();
        })
        .detach();
        cx.spawn_in(window, async move |_, cx| {
            let Some(nueva) = cx
                .background_spawn(async { crate::actualizaciones::buscar() })
                .await
            else {
                return;
            };
            let (nueva, resultado) = cx
                .background_spawn(async move {
                    let r = crate::actualizaciones::descargar_e_instalar(&nueva);
                    (nueva, r)
                })
                .await;
            cx.update(|window, cx| {
                let notificacion = match resultado {
                    Ok(Some(instalada)) => aviso_instalada(&nueva.numero, instalada),
                    Ok(None) => aviso_descarga(&nueva, None),
                    Err(e) => aviso_descarga(&nueva, Some(e)),
                };
                window.push_notification(notificacion, cx);
            })
            .ok();
        })
        .detach();
        Self {
            pantalla: Pantalla::Cargando,
            _suscripcion: None,
        }
    }

    fn mostrar_login(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        crate::monitoreo::usuario(None);
        let login = cx.new(|cx| LoginView::new(window, cx));
        self._suscripcion = Some(cx.subscribe_in(
            &login,
            window,
            |this, _, Autenticado(usuario), window, cx| {
                this.mostrar_espacio(usuario.clone(), window, cx);
            },
        ));
        self.pantalla = Pantalla::Login(login);
        cx.notify();
    }

    fn mostrar_espacio(&mut self, usuario: Usuario, window: &mut Window, cx: &mut Context<Self>) {
        crate::monitoreo::usuario(Some(usuario.id));
        let espacio = cx.new(|cx| Espacio::new(usuario, window, cx));
        self._suscripcion = Some(cx.subscribe_in(
            &espacio,
            window,
            |this, _, evento, window, cx| match evento {
                EventoEspacio::SesionCerrada => this.mostrar_login(window, cx),
            },
        ));
        self.pantalla = Pantalla::Espacio(espacio);
        cx.notify();
    }
}

/// La versión nueva ya está en disco: solo falta reiniciar.
fn aviso_instalada(numero: &str, instalada: crate::actualizaciones::Instalada) -> Notification {
    let instalada = std::rc::Rc::new(instalada);
    Notification::success(format!(
        "Cosmoflow {numero} se instaló en segundo plano. Reinicia para usarla."
    ))
    .title("Actualización lista")
    .autohide(false)
    .action(move |_, _, _| {
        let instalada = instalada.clone();
        Button::new("reiniciar-version")
            .primary()
            .label("Reiniciar")
            .on_click(
                move |_, window, cx| match crate::actualizaciones::reiniciar(&instalada) {
                    Ok(()) => cx.quit(),
                    Err(e) => window.push_notification(
                        Notification::error(format!("No se pudo reiniciar: {e}")),
                        cx,
                    ),
                },
            )
    })
}

/// Esta copia no se actualiza sola (macOS, tarball, sin permisos…): enlace a la descarga.
fn aviso_descarga(nueva: &crate::actualizaciones::Version, error: Option<String>) -> Notification {
    let url = nueva.url.clone();
    let mut texto = format!(
        "Cosmoflow {} ya está disponible (tienes la {}).",
        nueva.numero,
        env!("CARGO_PKG_VERSION")
    );
    if let Some(e) = error {
        texto.push_str(&format!(" No se pudo instalar sola: {e}."));
    }
    Notification::info(texto)
        .title("Nueva versión")
        .action(move |_, _, _| {
            let url = url.clone();
            Button::new("descargar-version")
                .label("Descargar")
                .on_click(move |_, _, _| {
                    let _ = open::that_detached(&url);
                })
        })
}

impl Render for CosmoflowApp {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        // El espacio pinta su propia barra (como el Navbar de la web, a la derecha del sidebar).
        let con_barra = !matches!(self.pantalla, Pantalla::Espacio(_));
        let contenido: AnyElement = match &self.pantalla {
            Pantalla::Cargando => div()
                .size_full()
                .flex()
                .items_center()
                .justify_center()
                .child(Spinner::new())
                .into_any_element(),
            Pantalla::Login(v) => v.clone().into_any_element(),
            Pantalla::Espacio(v) => v.clone().into_any_element(),
        };
        v_flex()
            .size_full()
            .bg(cx.theme().background)
            .text_color(cx.theme().foreground)
            .when(con_barra, |d| d.child(TitleBar::new()))
            .child(div().flex_1().min_h_0().child(contenido))
    }
}
