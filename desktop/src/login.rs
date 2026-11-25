//! Inicio de sesión con email y contraseña, y segundo paso (TOTP) si la cuenta lo tiene.
//! Registro, recuperar contraseña y Google se hacen en la web.

use gpui_kit::component::*;
use gpui_kit::component::{
    ActiveTheme,
    alert::Alert,
    button::{Button, ButtonVariants as _},
    input::{Input, InputEvent, InputState},
};
use gpui_kit::*;

use crate::api::Login;
use crate::modelos::Usuario;

pub struct Autenticado(pub Usuario);

pub struct LoginView {
    email: Entity<InputState>,
    password: Entity<InputState>,
    codigo: Entity<InputState>,
    /// Token intermedio cuando la cuenta pide el segundo paso.
    token_dos_pasos: Option<String>,
    enviando: bool,
    error: Option<SharedString>,
    _suscripciones: Vec<Subscription>,
}

impl EventEmitter<Autenticado> for LoginView {}

impl LoginView {
    pub fn new(window: &mut Window, cx: &mut Context<Self>) -> Self {
        let email = cx.new(|cx| InputState::new(window, cx).placeholder("tu@correo.com"));
        let password = cx.new(|cx| {
            InputState::new(window, cx)
                .masked(true)
                .placeholder("Contraseña")
        });
        let codigo = cx.new(|cx| InputState::new(window, cx).placeholder("123456"));
        let enter = |this: &mut Self,
                     _: &Entity<InputState>,
                     e: &InputEvent,
                     window: &mut Window,
                     cx: &mut Context<Self>| {
            if matches!(e, InputEvent::PressEnter { .. }) {
                this.enviar(window, cx);
            }
        };
        let _suscripciones = vec![
            cx.subscribe_in(&email, window, enter),
            cx.subscribe_in(&password, window, enter),
            cx.subscribe_in(&codigo, window, enter),
        ];
        email.read(cx).focus_handle(cx).focus(window, cx);
        Self {
            email,
            password,
            codigo,
            token_dos_pasos: None,
            enviando: false,
            error: None,
            _suscripciones,
        }
    }

    fn enviar(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        if self.enviando {
            return;
        }
        let api = crate::api(cx);
        let email = self.email.read(cx).value().to_string();
        let password = self.password.read(cx).value().to_string();
        let codigo = self.codigo.read(cx).value().to_string();
        let token = self.token_dos_pasos.clone();
        if token.is_none() && (email.trim().is_empty() || password.is_empty()) {
            self.error = Some("Escribe tu email y contraseña.".into());
            cx.notify();
            return;
        }
        self.enviando = true;
        self.error = None;
        cx.notify();

        cx.spawn_in(window, async move |this, cx| {
            let resultado = cx
                .background_spawn(async move {
                    match token {
                        Some(t) => api.completar_dos_pasos(&t, &codigo).map(Login::Sesion),
                        None => api.login(&email, &password),
                    }
                })
                .await;
            this.update_in(cx, |this, window, cx| {
                this.enviando = false;
                match resultado {
                    Ok(Login::Sesion(usuario)) => cx.emit(Autenticado(usuario)),
                    Ok(Login::DosPasos(t)) => {
                        this.token_dos_pasos = Some(t);
                        this.codigo.read(cx).focus_handle(cx).focus(window, cx);
                    }
                    Err(e) => this.error = Some(e.mensaje.into()),
                }
                cx.notify();
            })
            .ok();
        })
        .detach();
    }
}

impl Render for LoginView {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let dos_pasos = self.token_dos_pasos.is_some();
        let campo = |etiqueta: &'static str, input: AnyElement| {
            v_flex()
                .gap_1p5()
                .child(div().text_sm().font_medium().child(etiqueta))
                .child(input)
        };
        let formulario = if dos_pasos {
            v_flex()
                .gap_4()
                .child(
                    div()
                        .text_sm()
                        .text_color(cx.theme().muted_foreground)
                        .child("Escribe el código de tu app autenticadora o un código de recuperación."),
                )
                .child(campo("Código", Input::new(&self.codigo).into_any_element()))
        } else {
            v_flex()
                .gap_4()
                .child(campo("Email", Input::new(&self.email).into_any_element()))
                .child(campo(
                    "Contraseña",
                    Input::new(&self.password).mask_toggle().into_any_element(),
                ))
        };

        div()
            .size_full()
            .flex()
            .items_center()
            .justify_center()
            .child(
                v_flex()
                    .w(px(360.))
                    .gap_6()
                    .child(
                        v_flex()
                            .gap_1()
                            .child(div().text_xl().font_semibold().child(if dos_pasos {
                                "Verificación en dos pasos"
                            } else {
                                "Inicia sesión"
                            }))
                            .child(
                                div()
                                    .text_sm()
                                    .text_color(cx.theme().muted_foreground)
                                    .child("Usa tu cuenta de Cosmoflow."),
                            ),
                    )
                    .child(formulario)
                    .children(self.error.clone().map(|e| Alert::error("error-login", e)))
                    .child(
                        Button::new("entrar")
                            .primary()
                            .w_full()
                            .label(if self.enviando {
                                "Entrando…"
                            } else {
                                "Entrar"
                            })
                            .loading(self.enviando)
                            .disabled(self.enviando)
                            .on_click(cx.listener(|this, _, window, cx| this.enviar(window, cx))),
                    )
                    .child(
                        Button::new("crear-cuenta")
                            .ghost()
                            .w_full()
                            .label("Crear cuenta o recuperar contraseña en la web")
                            .on_click(|_, _, cx| {
                                let _ = open::that_detached(crate::api(cx).url_web());
                            }),
                    ),
            )
    }
}
