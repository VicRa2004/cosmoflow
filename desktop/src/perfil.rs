//! Perfil de usuario, apariencia, preferencias de notificaciones y seguridad.

use gpui_kit::assets::IconName;
use gpui_kit::component::*;
use gpui_kit::component::{
    ActiveTheme, Theme, ThemeMode,
    alert::Alert,
    avatar::Avatar,
    button::{Button, ButtonVariants as _},
    dialog::DialogButtonProps,
    group_box::GroupBoxVariant,
    input::{Input, InputEvent, InputState},
    notification::Notification,
    setting::{SettingField, SettingGroup, SettingItem, SettingPage, Settings},
    spinner::Spinner,
    switch::Switch,
    tab::TabBar,
    tag::Tag,
};
use gpui_kit::prelude::FluentBuilder as _;
use gpui_kit::*;
use serde_json::json;

use crate::modelos::{EstadoTelegram, PreferenciaNotificacion, Usuario};

const EVENTOS_NOTIFICACION: [(&str, &str); 6] = [
    ("tareaAsignada", "Te asignan una tarea"),
    ("mencion", "Te mencionan en una tarea"),
    (
        "estadoCambiado",
        "Cambia el estado de una tarea que creaste",
    ),
    ("vencimiento", "Una tarea tuya vence mañana o hoy"),
    (
        "comentario",
        "Comentan una tarea que creaste o de la que eres responsable",
    ),
    (
        "resumenDiario",
        "Resumen cada mañana: lo que vence hoy, lo atrasado y lo que empieza hoy",
    ),
];

#[derive(Clone, Copy, PartialEq, Eq)]
enum ModoTema {
    Sistema,
    Claro,
    Oscuro,
}

impl ModoTema {
    const TODOS: [Self; 3] = [Self::Sistema, Self::Claro, Self::Oscuro];

    fn indice(self) -> usize {
        match self {
            Self::Sistema => 0,
            Self::Claro => 1,
            Self::Oscuro => 2,
        }
    }

    fn etiqueta(self) -> &'static str {
        match self {
            Self::Sistema => "Sistema",
            Self::Claro => "Claro",
            Self::Oscuro => "Oscuro",
        }
    }
}

pub enum EventoPerfil {
    SesionCerrada,
}

impl EventEmitter<EventoPerfil> for PerfilView {}

pub struct PerfilView {
    usuario: Option<Usuario>,
    modo_tema: ModoTema,
    preferencias: Vec<PreferenciaNotificacion>,
    telegram: EstadoTelegram,
    cargando_prefs: bool,
    guardando_prefs: bool,
    error_prefs: Option<SharedString>,
    /// Descarta respuestas viejas cuando se lanza una nueva carga.
    revision: u64,
    enviando_verificacion: bool,
    cerrando_sesiones: bool,
}

impl PerfilView {
    pub fn new(window: &mut Window, cx: &mut Context<Self>) -> Self {
        let mut vista = Self {
            usuario: crate::api(cx).usuario(),
            modo_tema: ModoTema::Sistema,
            preferencias: Vec::new(),
            telegram: EstadoTelegram::default(),
            cargando_prefs: false,
            guardando_prefs: false,
            error_prefs: None,
            revision: 0,
            enviando_verificacion: false,
            cerrando_sesiones: false,
        };
        vista.cargar(window, cx);
        vista
    }

    pub fn cargar(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        self.usuario = crate::api(cx).usuario();
        self.revision += 1;
        let revision = self.revision;
        self.cargando_prefs = true;
        self.error_prefs = None;
        cx.notify();

        let api = crate::api(cx);
        cx.spawn_in(window, async move |this, cx| {
            let resultado = cx
                .background_spawn(async move {
                    let prefs =
                        api.get::<Vec<PreferenciaNotificacion>>("/notificaciones/preferencias")?;
                    let telegram = api
                        .get::<EstadoTelegram>("/notificaciones/telegram")
                        .unwrap_or_default();
                    Ok::<_, crate::api::ErrorApi>((prefs, telegram))
                })
                .await;

            this.update(cx, |this, cx| {
                if this.revision != revision {
                    return;
                }
                this.cargando_prefs = false;
                match resultado {
                    Ok((prefs, telegram)) => {
                        this.preferencias = prefs;
                        this.telegram = telegram;
                    }
                    Err(e) => this.error_prefs = Some(e.mensaje.into()),
                }
                cx.notify();
            })
            .ok();
        })
        .detach();
    }

    fn cambiar_tema(&mut self, modo: ModoTema, window: &mut Window, cx: &mut Context<Self>) {
        self.modo_tema = modo;
        match modo {
            ModoTema::Sistema => Theme::sync_system_appearance(Some(window), cx),
            ModoTema::Claro => Theme::change(ThemeMode::Light, Some(window), cx),
            ModoTema::Oscuro => Theme::change(ThemeMode::Dark, Some(window), cx),
        }
        cx.notify();
    }

    fn reenviar_verificacion(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        if self.enviando_verificacion {
            return;
        }
        self.enviando_verificacion = true;
        cx.notify();

        let api = crate::api(cx);
        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(async move { api.reenviar_verificacion_email() })
                .await;
            this.update_in(cx, |this, window, cx| {
                this.enviando_verificacion = false;
                match r {
                    Ok(mensaje) => window.push_notification(Notification::success(mensaje), cx),
                    Err(e) => window.push_notification(Notification::error(e.mensaje), cx),
                }
                cx.notify();
            })
            .ok();
        })
        .detach();
    }

    fn alternar_preferencia(
        &mut self,
        evento: String,
        canal: String,
        activo: bool,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        if self.guardando_prefs {
            return;
        }
        let previas = self.preferencias.clone();
        for p in &mut self.preferencias {
            if p.evento == evento && p.canal == canal {
                p.activo = activo;
                p.personalizado = true;
            }
        }
        self.guardando_prefs = true;
        cx.notify();

        let api = crate::api(cx);
        let cuerpo = json!([{ "evento": evento, "canal": canal, "activo": activo }]);
        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(async move {
                    api.put::<Vec<PreferenciaNotificacion>>("/notificaciones/preferencias", cuerpo)
                })
                .await;
            this.update_in(cx, |this, window, cx| {
                this.guardando_prefs = false;
                match r {
                    Ok(nuevas) => this.preferencias = nuevas,
                    Err(e) => {
                        this.preferencias = previas;
                        window.push_notification(Notification::error(e.mensaje), cx);
                    }
                }
                cx.notify();
            })
            .ok();
        })
        .detach();
    }

    fn abrir_cambiar_password(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        let actual_input = cx.new(|cx| {
            InputState::new(window, cx)
                .masked(true)
                .placeholder("Contraseña actual")
        });
        let nueva_input = cx.new(|cx| {
            InputState::new(window, cx)
                .masked(true)
                .placeholder("Mínimo 8 caracteres")
        });
        actual_input.read(cx).focus_handle(cx).focus(window, cx);

        let vista = cx.entity().downgrade();
        let enviar = {
            let actual_input = actual_input.clone();
            let nueva_input = nueva_input.clone();
            move |window: &mut Window, cx: &mut App| -> bool {
                let actual = actual_input.read(cx).value().to_string();
                let nueva = nueva_input.read(cx).value().to_string();
                if let Err(mensaje) = validar_cambio_password(&actual, &nueva) {
                    window.push_notification(Notification::error(mensaje), cx);
                    return false;
                }
                vista
                    .update(cx, |v, cx| v.guardar_password(actual, nueva, window, cx))
                    .ok();
                true
            }
        };

        let enviar_enter = enviar.clone();
        let _ = window.subscribe(&nueva_input, cx, move |_, e: &InputEvent, window, cx| {
            if matches!(e, InputEvent::PressEnter { .. }) && enviar_enter(window, cx) {
                window.close_dialog(cx);
            }
        });

        window.open_dialog(cx, move |dialog, _, cx| {
            let enviar = enviar.clone();
            dialog
                .title("Cambiar contraseña")
                .w(px(420.))
                .child(
                    v_flex()
                        .gap_4()
                        .child(
                            div()
                                .text_xs()
                                .text_color(cx.theme().muted_foreground)
                                .child("Se cerrarán tus demás sesiones activas."),
                        )
                        .child(
                            v_flex()
                                .gap_1p5()
                                .child(div().text_sm().font_medium().child("Contraseña actual"))
                                .child(Input::new(&actual_input).mask_toggle()),
                        )
                        .child(
                            v_flex()
                                .gap_1p5()
                                .child(div().text_sm().font_medium().child("Nueva contraseña"))
                                .child(Input::new(&nueva_input).mask_toggle())
                                .child(
                                    div()
                                        .text_xs()
                                        .text_color(cx.theme().muted_foreground)
                                        .child("Mínimo 8 caracteres."),
                                ),
                        ),
                )
                .button_props(
                    DialogButtonProps::default()
                        .ok_text("Guardar")
                        .show_cancel(true)
                        .cancel_text("Cancelar"),
                )
                .on_ok(move |_, window, cx| enviar(window, cx))
        });
    }

    fn guardar_password(
        &mut self,
        actual: String,
        nueva: String,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        let api = crate::api(cx);
        cx.spawn_in(window, async move |_, cx| {
            let r = cx
                .background_spawn(async move { api.cambiar_password(&actual, &nueva) })
                .await;
            cx.update(|window, cx| match r {
                Ok(()) => window.push_notification(
                    Notification::success("Contraseña actualizada correctamente."),
                    cx,
                ),
                Err(e) => window.push_notification(Notification::error(e.mensaje), cx),
            })
            .ok();
        })
        .detach();
    }

    fn cerrar_sesion(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        if self.cerrando_sesiones {
            return;
        }
        self.cerrando_sesiones = true;
        cx.notify();

        let api = crate::api(cx);
        cx.spawn_in(window, async move |this, cx| {
            cx.background_spawn(async move { api.logout() }).await;
            this.update(cx, |this, cx| {
                this.cerrando_sesiones = false;
                cx.emit(EventoPerfil::SesionCerrada);
            })
            .ok();
        })
        .detach();
    }

    fn confirmar_cerrar_todas(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        let vista = cx.entity().downgrade();
        window.open_alert_dialog(cx, move |dialog, _, _| {
            let vista = vista.clone();
            dialog
                .title("¿Cerrar todas las sesiones?")
                .child("Tendrás que volver a iniciar sesión en todos tus dispositivos.")
                .button_props(
                    DialogButtonProps::default()
                        .ok_text("Cerrar todas")
                        .ok_variant(gpui_kit::component::button::ButtonVariant::Danger)
                        .show_cancel(true)
                        .cancel_text("Cancelar"),
                )
                .on_ok(move |_, window, cx| {
                    vista
                        .update(cx, |v, cx| v.cerrar_todas_las_sesiones(window, cx))
                        .ok();
                    true
                })
        });
    }

    fn cerrar_todas_las_sesiones(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        if self.cerrando_sesiones {
            return;
        }
        self.cerrando_sesiones = true;
        cx.notify();

        let api = crate::api(cx);
        cx.spawn_in(window, async move |this, cx| {
            let r = cx.background_spawn(async move { api.logout_todas() }).await;
            this.update_in(cx, |this, window, cx| {
                this.cerrando_sesiones = false;
                if let Err(e) = r {
                    window.push_notification(Notification::error(e.mensaje), cx);
                }
                cx.emit(EventoPerfil::SesionCerrada);
            })
            .ok();
        })
        .detach();
    }

    fn pagina_cuenta(&self, cx: &mut Context<Self>) -> SettingPage {
        let vista = cx.entity().downgrade();
        let usuario = self.usuario.clone();
        let nombre = usuario
            .as_ref()
            .map(|u| u.nombre.clone())
            .unwrap_or_else(|| "Usuario".into());
        let email = usuario
            .as_ref()
            .map(|u| u.email.clone())
            .unwrap_or_else(|| "—".into());
        let verificado = usuario.as_ref().is_some_and(|u| u.email_verificado);
        let avatar_src = usuario
            .as_ref()
            .and_then(|u| u.avatar_url.as_deref())
            .filter(|url| !url.trim().is_empty())
            .map(|url| crate::api(cx).url_recurso(url));
        let enviando_verificacion = self.enviando_verificacion;
        let modo_indice = self.modo_tema.indice();

        let vista_verif = vista.clone();
        let grupo_cuenta = SettingGroup::new().title("Cuenta").item(
            SettingItem::render(move |_, _, cx| {
                let vista = vista_verif.clone();
                let avatar = Avatar::new()
                    .name(nombre.clone())
                    .large()
                    .when_some(avatar_src.clone(), |a, src| a.src(src));
                h_flex()
                    .w_full()
                    .gap_4()
                    .items_center()
                    .child(avatar)
                    .child(
                        v_flex()
                            .flex_1()
                            .min_w_0()
                            .gap_1()
                            .child(
                                div()
                                    .text_base()
                                    .font_semibold()
                                    .truncate()
                                    .child(nombre.clone()),
                            )
                            .child(
                                div()
                                    .text_sm()
                                    .text_color(cx.theme().muted_foreground)
                                    .truncate()
                                    .child(email.clone()),
                            )
                            .child(
                                h_flex()
                                    .gap_2()
                                    .pt_1()
                                    .child(if verificado {
                                        Tag::success().small().child("Email verificado")
                                    } else {
                                        Tag::warning().small().child("Email sin verificar")
                                    })
                                    .when(!verificado, |row| {
                                        row.child(
                                            Button::new("reenviar-verificacion")
                                                .outline()
                                                .xsmall()
                                                .label("Reenviar")
                                                .loading(enviando_verificacion)
                                                .disabled(enviando_verificacion)
                                                .on_click(move |_, window, cx| {
                                                    vista
                                                        .update(cx, |v, cx| {
                                                            v.reenviar_verificacion(window, cx)
                                                        })
                                                        .ok();
                                                }),
                                        )
                                    }),
                            ),
                    )
            })
            .keywords([
                "cuenta",
                "usuario",
                "avatar",
                "email",
                "correo",
                "verificado",
            ]),
        );

        let vista_tema = vista;
        let grupo_apariencia = SettingGroup::new().title("Apariencia").item(
            SettingItem::new(
                "Tema",
                SettingField::render(move |_, _, _| {
                    let vista = vista_tema.clone();
                    TabBar::new("perfil-tema")
                        .segmented()
                        .small()
                        .selected_index(modo_indice)
                        .children(ModoTema::TODOS.map(|m| m.etiqueta()))
                        .on_click(move |i: &usize, window, cx| {
                            if let Some(&modo) = ModoTema::TODOS.get(*i) {
                                vista
                                    .update(cx, |v, cx| v.cambiar_tema(modo, window, cx))
                                    .ok();
                            }
                        })
                }),
            )
            .description("Elige entre tema del sistema, claro u oscuro.")
            .keywords(["tema", "apariencia", "claro", "oscuro", "sistema"]),
        );

        SettingPage::new("Cuenta")
            .icon(IconName::User)
            .default_open(true)
            .resettable(false)
            .groups(vec![grupo_cuenta, grupo_apariencia])
    }

    fn pagina_notificaciones(&self, cx: &mut Context<Self>) -> SettingPage {
        let vista = cx.entity().downgrade();
        let grupo = if let Some(err) = self
            .error_prefs
            .clone()
            .filter(|_| self.preferencias.is_empty())
        {
            let vista_reintentar = vista.clone();
            SettingGroup::new().title("Preferencias").item(
                SettingItem::render(move |_, _, _| {
                    let vista = vista_reintentar.clone();
                    v_flex()
                        .w_full()
                        .gap_3()
                        .child(Alert::error("error-prefs-notif", err.clone()))
                        .child(
                            h_flex().justify_end().child(
                                Button::new("reintentar-prefs")
                                    .outline()
                                    .small()
                                    .icon(IconName::RefreshCw)
                                    .label("Reintentar")
                                    .on_click(move |_, window, cx| {
                                        vista.update(cx, |v, cx| v.cargar(window, cx)).ok();
                                    }),
                            ),
                        )
                })
                .keywords(["notificaciones", "preferencias", "error"]),
            )
        } else if self.cargando_prefs && self.preferencias.is_empty() {
            SettingGroup::new().title("Preferencias").item(
                SettingItem::render(|_, _, _| {
                    div()
                        .w_full()
                        .py_6()
                        .flex()
                        .justify_center()
                        .child(Spinner::new())
                })
                .keywords(["notificaciones", "preferencias"]),
            )
        } else {
            let items: Vec<SettingItem> = EVENTOS_NOTIFICACION
                .iter()
                .filter_map(|&(evento, descripcion)| {
                    let visibles: Vec<PreferenciaNotificacion> = self
                        .preferencias
                        .iter()
                        .filter(|p| {
                            p.evento == evento && canal_escritorio_visible(&p.canal, self.telegram)
                        })
                        .cloned()
                        .collect();
                    if visibles.is_empty() {
                        return None;
                    }
                    let hereda_org = visibles.iter().any(|p| !p.personalizado);
                    let guardando = self.guardando_prefs;
                    let telegram = self.telegram;
                    let vista_ev = vista.clone();
                    let mut item = SettingItem::new(
                        descripcion,
                        SettingField::render(move |_, _, _| {
                            let vista = vista_ev.clone();
                            h_flex()
                                .gap_4()
                                .flex_wrap()
                                .children(visibles.iter().map(|p| {
                                    let vista = vista.clone();
                                    let evento = p.evento.clone();
                                    let canal = p.canal.clone();
                                    let bloqueado =
                                        guardando || canal_bloqueado(&canal, telegram);
                                    let etiqueta = etiqueta_canal(&canal);
                                    let id_switch =
                                        SharedString::from(format!("pref-{evento}-{canal}"));
                                    Switch::new(id_switch)
                                        .small()
                                        .label(etiqueta)
                                        .checked(p.activo)
                                        .disabled(bloqueado)
                                        .when(
                                            canal == "telegram" && !telegram.vinculado,
                                            |s| {
                                                s.tooltip(
                                                    "Vincula tu cuenta de Telegram en la web para activar este canal.",
                                                )
                                            },
                                        )
                                        .on_change(move |activo: &bool, window, cx| {
                                            let activo = *activo;
                                            let evento = evento.clone();
                                            let canal = canal.clone();
                                            vista
                                                .update(cx, |v, cx| {
                                                    v.alternar_preferencia(
                                                        evento, canal, activo, window, cx,
                                                    )
                                                })
                                                .ok();
                                        })
                                }))
                        }),
                    )
                    .layout(Axis::Vertical)
                    .keywords(["notificaciones", evento, descripcion]);
                    if hereda_org {
                        item = item.description(
                            "Sin elegir: en cada organización vale lo que ella decida.",
                        );
                    }
                    Some(item)
                })
                .collect();

            let mut g = SettingGroup::new()
                .title("Canales por tipo de aviso")
                .footer(|_, _| {
                    "Nunca te avisamos de lo que haces tú. Las notificaciones push móviles (FCM) solo aplican a Android e iOS y se omiten en escritorio."
                });
            if items.is_empty() {
                g = g.item(
                    SettingItem::render(|_, _, cx| {
                        div()
                            .text_sm()
                            .text_color(cx.theme().muted_foreground)
                            .child("No hay preferencias disponibles.")
                    })
                    .keywords(["notificaciones"]),
                );
            } else {
                g = g.items(items);
            }
            g
        };

        SettingPage::new("Notificaciones")
            .icon(IconName::Bell)
            .resettable(false)
            .group(grupo)
    }

    fn pagina_seguridad(&self, cx: &mut Context<Self>) -> SettingPage {
        let vista = cx.entity().downgrade();
        let cerrando = self.cerrando_sesiones;

        let vista_pass = vista.clone();
        let grupo_pass = SettingGroup::new().title("Contraseña").item(
            SettingItem::new(
                "Cambiar contraseña",
                SettingField::render(move |options, _, _| {
                    let vista = vista_pass.clone();
                    Button::new("abrir-cambiar-password")
                        .outline()
                        .with_size(options.size())
                        .icon(IconName::Key)
                        .label("Cambiar contraseña")
                        .on_click(move |_, window, cx| {
                            vista
                                .update(cx, |v, cx| v.abrir_cambiar_password(window, cx))
                                .ok();
                        })
                }),
            )
            .description("Se cerrarán tus demás sesiones activas.")
            .keywords(["contraseña", "password", "seguridad"]),
        );

        let vista_logout = vista.clone();
        let vista_todas = vista;
        let grupo_sesiones = SettingGroup::new()
            .title("Sesiones")
            .item(
                SettingItem::new(
                    "Cerrar sesión",
                    SettingField::render(move |options, _, _| {
                        let vista = vista_logout.clone();
                        Button::new("perfil-cerrar-sesion")
                            .outline()
                            .with_size(options.size())
                            .icon(IconName::LogOut)
                            .label("Cerrar sesión")
                            .disabled(cerrando)
                            .on_click(move |_, window, cx| {
                                vista.update(cx, |v, cx| v.cerrar_sesion(window, cx)).ok();
                            })
                    }),
                )
                .description("Cierra la sesión en este dispositivo.")
                .keywords(["cerrar", "sesion", "logout"]),
            )
            .item(
                SettingItem::new(
                    "Cerrar todas las sesiones",
                    SettingField::render(move |options, _, _| {
                        let vista = vista_todas.clone();
                        Button::new("perfil-cerrar-todas")
                            .danger()
                            .with_size(options.size())
                            .icon(IconName::Shield)
                            .label("Cerrar todas")
                            .loading(cerrando)
                            .disabled(cerrando)
                            .on_click(move |_, window, cx| {
                                vista
                                    .update(cx, |v, cx| v.confirmar_cerrar_todas(window, cx))
                                    .ok();
                            })
                    }),
                )
                .description("Revoca tus sesiones en todos los dispositivos.")
                .keywords(["cerrar", "sesiones", "dispositivos", "revocar"]),
            );

        SettingPage::new("Seguridad")
            .icon(IconName::Shield)
            .resettable(false)
            .groups(vec![grupo_pass, grupo_sesiones])
    }

    fn pagina_acerca(&self, cx: &mut Context<Self>) -> SettingPage {
        let version = format!("v{}", env!("CARGO_PKG_VERSION"));
        let servidor = crate::api(cx).url_web();
        let grupo = SettingGroup::new()
            .title("Cosmoflow")
            .item(
                SettingItem::new(
                    "Versión de escritorio",
                    SettingField::render(move |_, _, cx| {
                        div()
                            .text_sm()
                            .text_color(cx.theme().muted_foreground)
                            .child(version.clone())
                    }),
                )
                .keywords(["version", "cosmoflow"]),
            )
            .item(
                SettingItem::new(
                    "Servidor",
                    SettingField::render(move |_, _, cx| {
                        div()
                            .text_sm()
                            .text_color(cx.theme().muted_foreground)
                            .child(servidor.clone())
                    }),
                )
                .keywords(["servidor", "api", "url"]),
            )
            .item(
                SettingItem::new(
                    "Aplicación web",
                    SettingField::render(|options, _, _| {
                        Button::new("perfil-abrir-web")
                            .outline()
                            .with_size(options.size())
                            .icon(IconName::ExternalLink)
                            .label("Abrir en la web")
                            .on_click(|_, _, cx| {
                                let _ = open::that_detached(crate::api(cx).url_web());
                            })
                    }),
                )
                .description("Gestiona opciones avanzadas como 2FA, Telegram o exportación.")
                .keywords(["web", "navegador", "telegram", "2fa"]),
            );

        SettingPage::new("Acerca de")
            .icon(IconName::Info)
            .resettable(false)
            .group(grupo)
    }
}

impl Render for PerfilView {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        div().size_full().child(
            Settings::new("perfil-ajustes")
                .with_group_variant(GroupBoxVariant::Outline)
                .pages(vec![
                    self.pagina_cuenta(cx),
                    self.pagina_notificaciones(cx),
                    self.pagina_seguridad(cx),
                    self.pagina_acerca(cx),
                ]),
        )
    }
}

fn validar_cambio_password(actual: &str, nueva: &str) -> Result<(), &'static str> {
    if actual.is_empty() {
        return Err("Ingresa tu contraseña actual.");
    }
    if nueva.chars().count() < 8 {
        return Err("La nueva contraseña debe tener al menos 8 caracteres.");
    }
    Ok(())
}

/// En escritorio se omiten las notificaciones push móviles (`movil`, FCM solo móvil).
fn canal_escritorio_visible(canal: &str, telegram: EstadoTelegram) -> bool {
    match canal {
        "movil" => false,
        "telegram" => telegram.disponible,
        _ => true,
    }
}

fn canal_bloqueado(canal: &str, telegram: EstadoTelegram) -> bool {
    canal == "telegram" && !telegram.vinculado
}

fn etiqueta_canal(canal: &str) -> &'static str {
    match canal {
        "app" => "En la app",
        "correo" => "Correo",
        "telegram" => "Telegram",
        "movil" => "Móvil",
        _ => "Otro",
    }
}

#[cfg(test)]
mod tests {
    use super::{
        EstadoTelegram, canal_bloqueado, canal_escritorio_visible, etiqueta_canal,
        validar_cambio_password,
    };

    #[test]
    fn valida_cambio_de_password() {
        assert!(validar_cambio_password("", "12345678").is_err());
        assert!(validar_cambio_password("actual", "1234567").is_err());
        assert!(validar_cambio_password("actual", "12345678").is_ok());
    }

    #[test]
    fn filtra_y_bloquea_canales_en_escritorio() {
        let sin_tg = EstadoTelegram {
            disponible: false,
            vinculado: false,
        };
        assert!(canal_escritorio_visible("app", sin_tg));
        assert!(canal_escritorio_visible("correo", sin_tg));
        assert!(!canal_escritorio_visible("movil", sin_tg));
        assert!(!canal_escritorio_visible("telegram", sin_tg));

        let con_tg_no_vinculado = EstadoTelegram {
            disponible: true,
            vinculado: false,
        };
        assert!(canal_escritorio_visible("telegram", con_tg_no_vinculado));
        assert!(canal_bloqueado("telegram", con_tg_no_vinculado));
        assert!(!canal_bloqueado("correo", con_tg_no_vinculado));

        let con_tg_vinculado = EstadoTelegram {
            disponible: true,
            vinculado: true,
        };
        assert!(!canal_bloqueado("telegram", con_tg_vinculado));
    }

    #[test]
    fn etiquetas_de_canales() {
        assert_eq!(etiqueta_canal("app"), "En la app");
        assert_eq!(etiqueta_canal("correo"), "Correo");
        assert_eq!(etiqueta_canal("telegram"), "Telegram");
    }
}
