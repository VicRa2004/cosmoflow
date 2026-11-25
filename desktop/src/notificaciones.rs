//! Notificaciones dentro de la aplicación y sondeo periódico del contador.

use std::time::{Duration, SystemTime, UNIX_EPOCH};

use gpui_kit::assets::IconName;
use gpui_kit::component::*;
use gpui_kit::component::{
    ActiveTheme,
    alert::Alert,
    button::{Button, ButtonVariants as _},
    notification::Notification,
    spinner::Spinner,
};
use gpui_kit::prelude::FluentBuilder as _;
use gpui_kit::*;

use crate::modelos::{BandejaNotificaciones, Notificacion};

const LIMITE_BANDEJA: usize = 50;
const INTERVALO_SONDEO_SEGS: u64 = 60;

pub struct EventoNotificaciones {
    pub no_leidas: usize,
}

impl EventEmitter<EventoNotificaciones> for NotificacionesView {}

pub struct NotificacionesView {
    notificaciones: Vec<Notificacion>,
    total: i64,
    no_leidas: usize,
    cargando: bool,
    marcando_todas: bool,
    error: Option<SharedString>,
    /// Descarta respuestas de una carga anterior si se lanzó otra más reciente.
    revision: u64,
    /// Mayor ID visto para detectar notificaciones recién llegadas durante el sondeo.
    ultimo_id_visto: Option<i64>,
    _sondeo: Task<()>,
}

impl NotificacionesView {
    pub fn new(window: &mut Window, cx: &mut Context<Self>) -> Self {
        let _sondeo = cx.spawn_in(window, async move |this, cx| {
            loop {
                cx.background_executor()
                    .timer(Duration::from_secs(INTERVALO_SONDEO_SEGS))
                    .await;
                let Some(api) = cx.update(|_, cx| crate::api(cx)).ok() else {
                    break;
                };
                let ruta = format!("/notificaciones?limite={LIMITE_BANDEJA}");
                let r = cx
                    .background_spawn(async move { api.get::<BandejaNotificaciones>(&ruta) })
                    .await;
                if let Ok(bandeja) = r {
                    let viva = this
                        .update_in(cx, |this, window, cx| {
                            this.aplicar_sondeo(bandeja, window, cx);
                        })
                        .is_ok();
                    if !viva {
                        break;
                    }
                }
            }
        });

        let mut vista = Self {
            notificaciones: vec![],
            total: 0,
            no_leidas: 0,
            cargando: false,
            marcando_todas: false,
            error: None,
            revision: 0,
            ultimo_id_visto: None,
            _sondeo,
        };
        vista.cargar(window, cx);
        vista
    }

    pub fn no_leidas(&self) -> usize {
        self.no_leidas
    }

    pub fn cargar(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        self.revision += 1;
        let revision = self.revision;
        self.cargando = true;
        self.error = None;
        cx.notify();

        let api = crate::api(cx);
        let ruta = format!("/notificaciones?limite={LIMITE_BANDEJA}");
        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(async move { api.get::<BandejaNotificaciones>(&ruta) })
                .await;
            this.update(cx, |this, cx| {
                if this.revision != revision {
                    return;
                }
                this.cargando = false;
                match r {
                    Ok(bandeja) => {
                        let cambio_contador = this.no_leidas != bandeja.no_leidas;
                        this.actualizar_estado(bandeja);
                        if cambio_contador {
                            cx.emit(EventoNotificaciones {
                                no_leidas: this.no_leidas,
                            });
                        }
                    }
                    Err(e) => this.error = Some(e.mensaje.into()),
                }
                cx.notify();
            })
            .ok();
        })
        .detach();
    }

    fn aplicar_sondeo(
        &mut self,
        bandeja: BandejaNotificaciones,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        if !self.cambio_bandeja(&bandeja) {
            return;
        }

        if let Some(max_id) = self.ultimo_id_visto
            && !window.is_window_active()
        {
            let nuevas: Vec<&Notificacion> = bandeja
                .datos
                .iter()
                .filter(|n| !n.leida && n.id > max_id)
                .collect();
            if !nuevas.is_empty() {
                notificar_sistema(&nuevas, cx);
            }
        }

        let cambio_contador = self.no_leidas != bandeja.no_leidas;
        self.actualizar_estado(bandeja);
        if cambio_contador {
            cx.emit(EventoNotificaciones {
                no_leidas: self.no_leidas,
            });
        }
        cx.notify();
    }

    fn cambio_bandeja(&self, bandeja: &BandejaNotificaciones) -> bool {
        if self.no_leidas != bandeja.no_leidas
            || self.total != bandeja.total_elementos
            || self.notificaciones.len() != bandeja.datos.len()
        {
            return true;
        }
        self.notificaciones
            .iter()
            .zip(bandeja.datos.iter())
            .any(|(actual, nueva)| actual.id != nueva.id || actual.leida != nueva.leida)
    }

    fn actualizar_estado(&mut self, bandeja: BandejaNotificaciones) {
        let max_recibido = bandeja.datos.iter().map(|n| n.id).max();
        self.ultimo_id_visto = match (self.ultimo_id_visto, max_recibido) {
            (Some(prev), Some(nuevo)) => Some(prev.max(nuevo)),
            (prev, nuevo) => prev.or(nuevo),
        };
        self.total = bandeja.total_elementos;
        self.no_leidas = bandeja.no_leidas;
        self.notificaciones = bandeja.datos;
        self.error = None;
    }

    fn marcar_leida(&mut self, id: i64, window: &mut Window, cx: &mut Context<Self>) {
        let ya_leida = self
            .notificaciones
            .iter()
            .find(|n| n.id == id)
            .is_none_or(|n| n.leida);
        if ya_leida {
            return;
        }

        let api = crate::api(cx);
        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(
                    async move { api.put_vacio(&format!("/notificaciones/{id}/leer")) },
                )
                .await;
            this.update_in(cx, |this, window, cx| match r {
                Ok(()) => {
                    if let Some(notif) = this.notificaciones.iter_mut().find(|n| n.id == id)
                        && !notif.leida
                    {
                        notif.leida = true;
                        this.no_leidas = this.no_leidas.saturating_sub(1);
                        cx.emit(EventoNotificaciones {
                            no_leidas: this.no_leidas,
                        });
                        cx.notify();
                    }
                }
                Err(e) => window.push_notification(Notification::error(e.mensaje), cx),
            })
            .ok();
        })
        .detach();
    }

    fn marcar_todas_leidas(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        if self.marcando_todas || self.no_leidas == 0 {
            return;
        }
        self.marcando_todas = true;
        cx.notify();

        let api = crate::api(cx);
        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(async move { api.post_vacio("/notificaciones/leer-todas") })
                .await;
            this.update_in(cx, |this, window, cx| {
                this.marcando_todas = false;
                match r {
                    Ok(()) => {
                        for notif in &mut this.notificaciones {
                            notif.leida = true;
                        }
                        if this.no_leidas != 0 {
                            this.no_leidas = 0;
                            cx.emit(EventoNotificaciones { no_leidas: 0 });
                        }
                    }
                    Err(e) => window.push_notification(Notification::error(e.mensaje), cx),
                }
                cx.notify();
            })
            .ok();
        })
        .detach();
    }

    fn fila(&self, n: &Notificacion, cx: &mut Context<Self>) -> impl IntoElement {
        let id = n.id;
        let sin_leer = !n.leida;
        let fecha = fecha_relativa(&n.created_at);

        h_flex()
            .id(("notificacion", id as u64))
            .w_full()
            .items_start()
            .gap_3()
            .px_4()
            .py_3()
            .rounded(cx.theme().radius)
            .border_1()
            .border_color(if sin_leer {
                cx.theme().border
            } else {
                cx.theme().border.opacity(0.4)
            })
            .when(sin_leer, |d| d.bg(cx.theme().accent.opacity(0.45)))
            .hover(|d| d.bg(cx.theme().accent.opacity(0.7)))
            .when(sin_leer, |d| {
                d.on_click(cx.listener(move |this, _, window, cx| {
                    this.marcar_leida(id, window, cx);
                }))
            })
            // Slot de ancho fijo para que el texto mantenga la misma columna en leídas y no leídas.
            .child(
                div()
                    .w_3()
                    .pt_1p5()
                    .flex()
                    .justify_center()
                    .when(sin_leer, |d| {
                        d.child(div().size_2().rounded_full().bg(cx.theme().primary))
                    }),
            )
            .child(
                v_flex()
                    .flex_1()
                    .min_w_0()
                    .gap_1()
                    .child(
                        h_flex()
                            .gap_2()
                            .items_baseline()
                            .child(
                                div()
                                    .flex_1()
                                    .min_w_0()
                                    .text_sm()
                                    .when(sin_leer, |d| d.font_semibold())
                                    .child(n.asunto.clone()),
                            )
                            .when(sin_leer, |d| {
                                d.child(
                                    div()
                                        .text_xs()
                                        .font_medium()
                                        .text_color(cx.theme().primary)
                                        .child("Sin leer"),
                                )
                            })
                            .child(
                                div()
                                    .text_xs()
                                    .text_color(cx.theme().muted_foreground)
                                    .child(fecha),
                            ),
                    )
                    .when(!n.texto.trim().is_empty(), |d| {
                        d.child(
                            div()
                                .text_sm()
                                .text_color(if sin_leer {
                                    cx.theme().foreground
                                } else {
                                    cx.theme().muted_foreground
                                })
                                .child(n.texto.clone()),
                        )
                    })
                    .when_some(n.actor.as_ref(), |d, actor| {
                        d.child(
                            div()
                                .text_xs()
                                .text_color(cx.theme().muted_foreground)
                                .child(actor.nombre.clone()),
                        )
                    }),
            )
    }
}

impl Render for NotificacionesView {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let resumen = if self.no_leidas == 0 {
            "Al día".to_string()
        } else if self.no_leidas == 1 {
            "1 sin leer".to_string()
        } else {
            format!("{} sin leer", self.no_leidas)
        };

        let filas: Vec<_> = self
            .notificaciones
            .iter()
            .map(|n| self.fila(n, cx).into_any_element())
            .collect();

        v_flex()
            .size_full()
            .child(
                h_flex()
                    .px_6()
                    .py_4()
                    .gap_3()
                    .border_b_1()
                    .border_color(cx.theme().border)
                    .child(
                        v_flex()
                            .flex_1()
                            .min_w_0()
                            .gap_0p5()
                            .child(div().text_lg().font_semibold().child("Notificaciones"))
                            .child(
                                div()
                                    .text_xs()
                                    .text_color(cx.theme().muted_foreground)
                                    .child(resumen),
                            ),
                    )
                    .child(
                        Button::new("marcar-todas-leidas")
                            .outline()
                            .small()
                            .icon(IconName::CheckCheck)
                            .label("Marcar todas como leídas")
                            .loading(self.marcando_todas)
                            .disabled(self.no_leidas == 0 || self.marcando_todas)
                            .on_click(cx.listener(|this, _, window, cx| {
                                this.marcar_todas_leidas(window, cx);
                            })),
                    )
                    .child(
                        Button::new("recargar-notificaciones")
                            .ghost()
                            .small()
                            .icon(IconName::RefreshCw)
                            .tooltip("Recargar")
                            .on_click(cx.listener(|this, _, window, cx| {
                                this.cargar(window, cx);
                            })),
                    ),
            )
            .child(
                v_flex()
                    .id("lista-notificaciones")
                    .flex_1()
                    .min_h_0()
                    .overflow_y_scroll()
                    .p_4()
                    .gap_2()
                    .map(|d| match (&self.error, self.cargando, filas.is_empty()) {
                        (Some(e), _, _) => d.child(Alert::error("error-notificaciones", e.clone())),
                        (None, true, true) => d.child(
                            div()
                                .flex_1()
                                .flex()
                                .items_center()
                                .justify_center()
                                .py_12()
                                .child(Spinner::new()),
                        ),
                        (None, false, true) => {
                            d.child(
                                v_flex()
                                    .flex_1()
                                    .items_center()
                                    .justify_center()
                                    .py_12()
                                    .gap_2()
                                    .text_color(cx.theme().muted_foreground)
                                    .child(Icon::new(IconName::BellOff).size_6())
                                    .child(
                                        div()
                                            .text_sm()
                                            .font_medium()
                                            .child("No tienes notificaciones"),
                                    )
                                    .child(div().text_xs().child(
                                        "Cuando alguien te asigne o mencione aparecerá aquí.",
                                    )),
                            )
                        }
                        _ => d.children(filas),
                    }),
            )
    }
}

fn notificar_sistema(nuevas: &[&Notificacion], cx: &App) {
    let notif = if nuevas.len() == 1 {
        crate::sistema::aviso(nuevas[0])
    } else {
        let resumen = nuevas.first().map(|n| n.asunto.clone()).unwrap_or_default();
        SystemNotification {
            tag: "cosmoflow-notificaciones".into(),
            title: format!("{} notificaciones nuevas", nuevas.len()).into(),
            body: resumen.into(),
            actions: Vec::new(),
        }
    };
    cx.show_system_notification(notif);
}

fn fecha_relativa(iso: &str) -> String {
    let ahora = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);
    fecha_relativa_desde(iso, ahora)
}

/// Formatea un timestamp ISO-8601 respecto a `ahora_seg` (segundos Unix) en español.
fn fecha_relativa_desde(iso: &str, ahora_seg: i64) -> String {
    let Some((ts, anio, mes, dia)) = parsear_iso8601(iso) else {
        return iso.split('T').next().unwrap_or(iso).to_string();
    };
    let diff = (ahora_seg - ts).max(0);
    if diff < 60 {
        return "Ahora mismo".into();
    }
    let mins = diff / 60;
    if mins < 60 {
        return if mins == 1 {
            "Hace 1 min".into()
        } else {
            format!("Hace {mins} min")
        };
    }
    let horas = diff / 3600;
    if horas < 24 {
        return if horas == 1 {
            "Hace 1 hora".into()
        } else {
            format!("Hace {horas} horas")
        };
    }
    let dias = diff / 86_400;
    if dias == 1 {
        return "Ayer".into();
    }
    if dias < 7 {
        return format!("Hace {dias} días");
    }
    if dias < 30 {
        let semanas = dias / 7;
        return if semanas == 1 {
            "Hace 1 semana".into()
        } else {
            format!("Hace {semanas} semanas")
        };
    }

    const MESES: [&str; 12] = [
        "ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic",
    ];
    let mes_txt = MESES
        .get((mes as usize).saturating_sub(1))
        .copied()
        .unwrap_or("");
    if dias < 365 {
        format!("{dia} {mes_txt}")
    } else {
        format!("{dia} {mes_txt} {anio}")
    }
}

/// Parsea `YYYY-MM-DDTHH:MM:SS[.fff][Z|±HH:MM]` a `(unix_seg, anio, mes, dia)`.
fn parsear_iso8601(iso: &str) -> Option<(i64, i32, u32, u32)> {
    let (fecha, hora_zona) = iso.trim().split_once('T')?;
    let mut f = fecha.split('-');
    let anio: i32 = f.next()?.parse().ok()?;
    let mes: u32 = f.next()?.parse().ok()?;
    let dia: u32 = f.next()?.parse().ok()?;
    if f.next().is_some() || !(1..=12).contains(&mes) || !(1..=31).contains(&dia) {
        return None;
    }

    let (hora_str, offset_seg) = if let Some(h) = hora_zona.strip_suffix('Z') {
        (h, 0i64)
    } else if let Some(pos) = hora_zona.rfind(['+', '-']) {
        let (h, z) = hora_zona.split_at(pos);
        let signo = if z.starts_with('-') { -1i64 } else { 1i64 };
        let mut zp = z[1..].split(':');
        let oh: i64 = zp.next()?.parse().ok()?;
        let om: i64 = zp.next().unwrap_or("0").parse().ok()?;
        (h, signo * (oh * 3600 + om * 60))
    } else {
        (hora_zona, 0i64)
    };

    let hora_sin_frac = hora_str.split('.').next()?;
    let mut hp = hora_sin_frac.split(':');
    let hora: i64 = hp.next()?.parse().ok()?;
    let min: i64 = hp.next()?.parse().ok()?;
    let seg: i64 = hp.next().unwrap_or("0").parse().ok()?;
    if !(0..=23).contains(&hora) || !(0..=59).contains(&min) || !(0..=60).contains(&seg) {
        return None;
    }

    let dias_epoch = dias_desde_epoch(anio, mes, dia);
    let ts = dias_epoch * 86_400 + hora * 3600 + min * 60 + seg - offset_seg;
    Some((ts, anio, mes, dia))
}

/// Algoritmo de Howard Hinnant para convertir fecha gregoriana civil a días desde 1970-01-01.
fn dias_desde_epoch(anio: i32, mes: u32, dia: u32) -> i64 {
    let y = i64::from(anio) - if mes <= 2 { 1 } else { 0 };
    let era = if y >= 0 { y } else { y - 399 } / 400;
    let yoe = y - era * 400;
    let m = i64::from(mes);
    let doy = (153 * (m + if m > 2 { -3 } else { 9 }) + 2) / 5 + i64::from(dia) - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    era * 146_097 + doe - 719_468
}

#[cfg(test)]
mod tests {
    #[test]
    fn formatea_fechas_relativas() {
        let base = super::parsear_iso8601("2026-11-24T12:00:00.000Z")
            .unwrap()
            .0;

        assert_eq!(
            super::fecha_relativa_desde("2026-11-24T11:59:30Z", base),
            "Ahora mismo"
        );
        assert_eq!(
            super::fecha_relativa_desde("2026-11-24T11:59:00Z", base),
            "Hace 1 min"
        );
        assert_eq!(
            super::fecha_relativa_desde("2026-11-24T11:45:00Z", base),
            "Hace 15 min"
        );
        assert_eq!(
            super::fecha_relativa_desde("2026-11-24T11:00:00Z", base),
            "Hace 1 hora"
        );
        assert_eq!(
            super::fecha_relativa_desde("2026-11-24T07:00:00Z", base),
            "Hace 5 horas"
        );
        assert_eq!(
            super::fecha_relativa_desde("2026-11-23T10:00:00Z", base),
            "Ayer"
        );
        assert_eq!(
            super::fecha_relativa_desde("2026-11-20T12:00:00Z", base),
            "Hace 4 días"
        );
        assert_eq!(
            super::fecha_relativa_desde("2026-11-16T12:00:00Z", base),
            "Hace 1 semana"
        );
        assert_eq!(
            super::fecha_relativa_desde("2026-11-05T12:00:00Z", base),
            "Hace 2 semanas"
        );
        assert_eq!(
            super::fecha_relativa_desde("2026-09-10T12:00:00Z", base),
            "10 sep"
        );
        assert_eq!(
            super::fecha_relativa_desde("2025-01-05T12:00:00Z", base),
            "5 ene 2025"
        );
        assert_eq!(
            super::fecha_relativa_desde("2026-11-24T05:50:00-06:00", base),
            "Hace 10 min"
        );
        assert_eq!(super::fecha_relativa_desde("invalida", base), "invalida");
    }
}
