//! Raíz de la ventana: decide entre login y espacio de trabajo según la sesión.

use gpui_kit::component::*;
use gpui_kit::component::{ActiveTheme, TitleBar, spinner::Spinner};
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
        Self {
            pantalla: Pantalla::Cargando,
            _suscripcion: None,
        }
    }

    fn mostrar_login(&mut self, window: &mut Window, cx: &mut Context<Self>) {
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
