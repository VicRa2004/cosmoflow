//! Raíz de la ventana: decide entre login y espacio de trabajo según la sesión.

use gpui_kit::component::*;
use gpui_kit::component::{
    ActiveTheme, TitleBar, button::Button, notification::Notification, spinner::Spinner,
};
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
            cx.update(|window, cx| {
                let url = nueva.url.clone();
                window.push_notification(
                    Notification::info(format!(
                        "Cosmoflow {} ya está disponible (tienes la {}).",
                        nueva.numero,
                        env!("CARGO_PKG_VERSION")
                    ))
                    .title("Nueva versión")
                    .action(move |_, _, _| {
                        let url = url.clone();
                        Button::new("descargar-version")
                            .label("Descargar")
                            .on_click(move |_, _, _| {
                                let _ = open::that_detached(&url);
                            })
                    }),
                    cx,
                );
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

impl Render for CosmoflowApp {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
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
            .child(TitleBar::new().child(div().text_sm().child("Cosmoflow")))
            .child(div().flex_1().min_h_0().child(contenido))
    }
}
