//! Calendario mensual: cuadrícula de días con tareas abiertas y detalle del día seleccionado.

use std::collections::BTreeMap;
use std::time::{SystemTime, UNIX_EPOCH};

use gpui_kit::assets::IconName;
use gpui_kit::component::*;
use gpui_kit::component::{
    ActiveTheme,
    alert::Alert,
    button::{Button, ButtonVariants as _},
    checkbox::Checkbox,
    notification::Notification,
    spinner::Spinner,
    text::TextView,
};
use gpui_kit::prelude::FluentBuilder as _;
use gpui_kit::*;
use serde_json::json;

use crate::modelos::{EstadoTarea, Prioridad, Tarea};

const DIAS_SEMANA_CORTOS: [&str; 7] = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DIAS_SEMANA_LARGOS: [&str; 7] = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
];
const MESES: [&str; 12] = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
];

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub(crate) struct FechaCivil {
    pub anio: i32,
    pub mes: u32,
    pub dia: u32,
}

impl FechaCivil {
    pub fn hoy_utc() -> Self {
        let secs = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;
        Self::desde_dias_epoch(secs.div_euclid(86_400))
    }

    pub fn parsear(s: &str) -> Option<Self> {
        let fecha = s.trim().get(..10)?;
        let mut partes = fecha.split('-');
        let anio: i32 = partes.next()?.parse().ok()?;
        let mes: u32 = partes.next()?.parse().ok()?;
        let dia: u32 = partes.next()?.parse().ok()?;
        if partes.next().is_some() || !(1..=12).contains(&mes) {
            return None;
        }
        let max_dia = dias_en_mes(anio, mes);
        if !(1..=max_dia).contains(&dia) {
            return None;
        }
        Some(Self { anio, mes, dia })
    }

    pub fn formatear(self) -> String {
        format!("{:04}-{:02}-{:02}", self.anio, self.mes, self.dia)
    }

    pub fn clave_id(self) -> u64 {
        let a = self.anio.max(0) as u64;
        a * 10_000 + u64::from(self.mes) * 100 + u64::from(self.dia)
    }

    /// Días desde 1970-01-01 usando el algoritmo civil de Howard Hinnant.
    pub fn dias_desde_epoch(self) -> i64 {
        let y = i64::from(self.anio) - if self.mes <= 2 { 1 } else { 0 };
        let era = if y >= 0 { y } else { y - 399 } / 400;
        let yoe = y - era * 400;
        let m = i64::from(self.mes);
        let doy = (153 * (m + if m > 2 { -3 } else { 9 }) + 2) / 5 + i64::from(self.dia) - 1;
        let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
        era * 146_097 + doe - 719_468
    }

    /// Convierte días desde 1970-01-01 a fecha civil (algoritmo inverso de Howard Hinnant).
    pub fn desde_dias_epoch(dias: i64) -> Self {
        let z = dias + 719_468;
        let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
        let doe = z - era * 146_097;
        let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146_096) / 365;
        let y = yoe + era * 400;
        let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
        let mp = (5 * doy + 2) / 153;
        let dia = doy - (153 * mp + 2) / 5 + 1;
        let mes = mp + if mp < 10 { 3 } else { -9 };
        let anio = y + if mes <= 2 { 1 } else { 0 };
        Self {
            anio: anio as i32,
            mes: mes as u32,
            dia: dia as u32,
        }
    }

    pub fn diferencia_dias(self, otra: Self) -> i64 {
        self.dias_desde_epoch() - otra.dias_desde_epoch()
    }

    /// 0 = lunes .. 6 = domingo (1970-01-01 fue jueves = 3).
    pub fn dia_semana_lunes0(self) -> usize {
        (self.dias_desde_epoch() + 3).rem_euclid(7) as usize
    }

    pub fn etiqueta_larga(self) -> String {
        let dia_sem = DIAS_SEMANA_LARGOS[self.dia_semana_lunes0()];
        let mes_nombre = nombre_mes(self.mes).to_lowercase();
        format!("{dia_sem}, {} de {mes_nombre} de {}", self.dia, self.anio)
    }
}

pub(crate) fn es_bisiesto(anio: i32) -> bool {
    (anio % 4 == 0 && anio % 100 != 0) || anio % 400 == 0
}

pub(crate) fn dias_en_mes(anio: i32, mes: u32) -> u32 {
    match mes {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 => {
            if es_bisiesto(anio) {
                29
            } else {
                28
            }
        }
        _ => 30,
    }
}

pub(crate) fn nombre_mes(mes: u32) -> &'static str {
    MESES
        .get((mes as usize).saturating_sub(1))
        .copied()
        .unwrap_or("")
}

pub(crate) fn mover_mes(anio: i32, mes: u32, delta: i32) -> (i32, u32) {
    let total_meses = anio * 12 + (mes as i32 - 1) + delta;
    let nuevo_anio = total_meses.div_euclid(12);
    let nuevo_mes = total_meses.rem_euclid(12) as u32 + 1;
    (nuevo_anio, nuevo_mes)
}

/// Días de la cuadrícula mensual: semanas completas de lunes a domingo.
pub(crate) fn cuadricula_mes(anio: i32, mes: u32) -> Vec<FechaCivil> {
    let primero = FechaCivil { anio, mes, dia: 1 };
    let antes = primero.dia_semana_lunes0();
    let dias_mes = dias_en_mes(anio, mes) as usize;
    let total = (antes + dias_mes).div_ceil(7) * 7;
    let inicio_epoch = primero.dias_desde_epoch() - antes as i64;
    (0..total)
        .map(|i| FechaCivil::desde_dias_epoch(inicio_epoch + i as i64))
        .collect()
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum UrgenciaVencimiento {
    Vencida,
    HoyOManana,
    Normal,
}

pub(crate) fn etiqueta_vencimiento(
    fecha: Option<&str>,
    abierta: bool,
    hoy: FechaCivil,
) -> (String, UrgenciaVencimiento) {
    let Some(texto) = fecha.filter(|s| !s.trim().is_empty()) else {
        return ("Sin fecha".into(), UrgenciaVencimiento::Normal);
    };
    let Some(parsed) = FechaCivil::parsear(texto) else {
        return (texto.to_string(), UrgenciaVencimiento::Normal);
    };
    if !abierta {
        return (parsed.formatear(), UrgenciaVencimiento::Normal);
    }
    let diff = parsed.diferencia_dias(hoy);
    if diff < 0 {
        (
            format!("Vencida · {}", parsed.formatear()),
            UrgenciaVencimiento::Vencida,
        )
    } else if diff == 0 {
        ("Hoy".into(), UrgenciaVencimiento::HoyOManana)
    } else if diff == 1 {
        ("Mañana".into(), UrgenciaVencimiento::HoyOManana)
    } else {
        (parsed.formatear(), UrgenciaVencimiento::Normal)
    }
}

/// Agrupa las tareas abiertas por su fecha de vencimiento (o de inicio si no tiene vencimiento).
pub(crate) fn agrupar_tareas_por_dia(tareas: Vec<Tarea>) -> BTreeMap<String, Vec<Tarea>> {
    let mut por_dia: BTreeMap<String, Vec<Tarea>> = BTreeMap::new();
    for t in tareas {
        if !t.estado.is_abierta() {
            continue;
        }
        let dia_raw = t
            .fecha_vencimiento
            .as_deref()
            .filter(|s| !s.trim().is_empty())
            .or_else(|| t.fecha_inicio.as_deref().filter(|s| !s.trim().is_empty()));
        let Some(dia) = dia_raw.and_then(FechaCivil::parsear) else {
            continue;
        };
        por_dia.entry(dia.formatear()).or_default().push(t);
    }
    por_dia
}

/// Cuerpo de detalle de solo lectura compartido entre `InicioView` y `CalendarioView`.
pub(crate) fn detalle_tarea_solo_lectura(t: &Tarea, hoy: FechaCivil, cx: &App) -> Div {
    let id = t.id;
    let hechas = t.subtareas.iter().filter(|s| s.completada).count();
    let (vence_txt, urgencia) =
        etiqueta_vencimiento(t.fecha_vencimiento.as_deref(), t.estado.is_abierta(), hoy);
    let inicio_txt = t
        .fecha_inicio
        .as_deref()
        .filter(|s| !s.trim().is_empty())
        .unwrap_or("Sin inicio")
        .to_string();
    let color_vence = match urgencia {
        UrgenciaVencimiento::Vencida => cx.theme().danger,
        UrgenciaVencimiento::HoyOManana => cx.theme().warning,
        UrgenciaVencimiento::Normal => cx.theme().foreground,
    };

    v_flex()
        .gap_4()
        .child(
            v_flex()
                .gap_2()
                .p_3()
                .rounded(cx.theme().radius)
                .border_1()
                .border_color(cx.theme().border)
                .bg(cx.theme().muted.opacity(0.25))
                .child(fila_dato("Estado", t.estado.etiqueta(), None, cx))
                .child(fila_dato(
                    "Prioridad",
                    t.prioridad.etiqueta(),
                    (t.prioridad == Prioridad::Alta).then_some(cx.theme().danger),
                    cx,
                ))
                .child(fila_dato("Inicio", &inicio_txt, None, cx))
                .child(fila_dato("Vencimiento", &vence_txt, Some(color_vence), cx))
                .when(
                    t.organizacion_id.is_some() || t.proyecto_id.is_some(),
                    |d| d.child(fila_dato("Ámbito", "Compartida", None, cx)),
                ),
        )
        .when(t.bloqueada, |d| {
            d.child(Alert::warning(
                ("bloqueada-detalle", id as u64),
                "Bloqueada: depende de otra tarea sin completar.",
            ))
        })
        .when(!t.subtareas.is_empty(), |d| {
            d.child(
                v_flex()
                    .gap_2()
                    .child(
                        div()
                            .text_sm()
                            .font_medium()
                            .child(format!("Checklist · {hechas}/{}", t.subtareas.len())),
                    )
                    .children(t.subtareas.iter().map(|s| {
                        h_flex()
                            .id(("subtarea-lectura", s.id as u64))
                            .gap_2()
                            .items_center()
                            .child(
                                Icon::new(if s.completada {
                                    IconName::SquareCheck
                                } else {
                                    IconName::Clock
                                })
                                .size_3p5()
                                .text_color(if s.completada {
                                    cx.theme().primary
                                } else {
                                    cx.theme().muted_foreground
                                }),
                            )
                            .child(
                                div()
                                    .flex_1()
                                    .min_w_0()
                                    .text_sm()
                                    .when(s.completada, |d| {
                                        d.line_through().text_color(cx.theme().muted_foreground)
                                    })
                                    .child(s.titulo.clone()),
                            )
                    })),
            )
        })
        .when(!t.contenido.trim().is_empty(), |d| {
            d.child(
                v_flex().gap_1p5().child(
                    TextView::markdown(("detalle-contenido", id as u64), t.contenido.clone())
                        .selectable(true),
                ),
            )
        })
        .when(t.contenido.trim().is_empty(), |d| {
            d.child(
                div()
                    .text_sm()
                    .text_color(cx.theme().muted_foreground)
                    .child("Sin descripción adicional."),
            )
        })
}

fn fila_dato(etiqueta: &str, valor: &str, color_valor: Option<Hsla>, cx: &App) -> impl IntoElement {
    h_flex()
        .justify_between()
        .gap_3()
        .text_sm()
        .child(
            div()
                .text_color(cx.theme().muted_foreground)
                .child(etiqueta.to_string()),
        )
        .child(
            div()
                .font_medium()
                .when_some(color_valor, |d, c| d.text_color(c))
                .child(valor.to_string()),
        )
}

pub struct CalendarioView {
    anio: i32,
    mes: u32,
    seleccionado: FechaCivil,
    por_dia: BTreeMap<String, Vec<Tarea>>,
    cargando: bool,
    error: Option<SharedString>,
    revision: u64,
}

impl CalendarioView {
    pub fn new(window: &mut Window, cx: &mut Context<Self>) -> Self {
        let hoy = FechaCivil::hoy_utc();
        let mut vista = Self {
            anio: hoy.anio,
            mes: hoy.mes,
            seleccionado: hoy,
            por_dia: BTreeMap::new(),
            cargando: false,
            error: None,
            revision: 0,
        };
        vista.cargar(window, cx);
        vista
    }

    pub fn cargar(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        self.revision += 1;
        let revision = self.revision;
        self.cargando = true;
        self.error = None;
        cx.notify();

        let dias = cuadricula_mes(self.anio, self.mes);
        let desde = dias
            .first()
            .copied()
            .unwrap_or(FechaCivil {
                anio: self.anio,
                mes: self.mes,
                dia: 1,
            })
            .formatear();
        let hasta = dias
            .last()
            .copied()
            .unwrap_or(FechaCivil {
                anio: self.anio,
                mes: self.mes,
                dia: 28,
            })
            .formatear();
        let ruta = format!("/tareas/calendario?desde={desde}&hasta={hasta}");
        let api = crate::api(cx);

        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(async move { api.get::<Vec<Tarea>>(&ruta) })
                .await;
            this.update(cx, |this, cx| {
                if this.revision != revision {
                    return;
                }
                this.cargando = false;
                match r {
                    Ok(tareas) => this.por_dia = agrupar_tareas_por_dia(tareas),
                    Err(e) => this.error = Some(e.mensaje.into()),
                }
                cx.notify();
            })
            .ok();
        })
        .detach();
    }

    fn mover(&mut self, delta: i32, window: &mut Window, cx: &mut Context<Self>) {
        let (anio, mes) = mover_mes(self.anio, self.mes, delta);
        self.anio = anio;
        self.mes = mes;
        self.cargar(window, cx);
    }

    fn ir_a_hoy(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        let hoy = FechaCivil::hoy_utc();
        let cambio_mes = self.anio != hoy.anio || self.mes != hoy.mes;
        self.anio = hoy.anio;
        self.mes = hoy.mes;
        self.seleccionado = hoy;
        if cambio_mes {
            self.cargar(window, cx);
        } else {
            cx.notify();
        }
    }

    fn seleccionar_dia(&mut self, fecha: FechaCivil, window: &mut Window, cx: &mut Context<Self>) {
        let cambio_mes = fecha.anio != self.anio || fecha.mes != self.mes;
        self.seleccionado = fecha;
        if cambio_mes {
            self.anio = fecha.anio;
            self.mes = fecha.mes;
            self.cargar(window, cx);
        } else {
            cx.notify();
        }
    }

    fn completar_tarea(&mut self, id: i64, window: &mut Window, cx: &mut Context<Self>) {
        let api = crate::api(cx);
        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(async move {
                    api.put::<Tarea>(&format!("/tareas/{id}"), json!({ "estado": "completada" }))
                })
                .await;
            this.update_in(cx, |this, window, cx| match r {
                Ok(_) => {
                    window.push_notification(Notification::success("Tarea completada."), cx);
                    this.cargar(window, cx);
                }
                Err(e) => {
                    window.push_notification(Notification::error(e.mensaje), cx);
                }
            })
            .ok();
        })
        .detach();
    }

    fn abrir_detalle(&mut self, tarea: Tarea, window: &mut Window, cx: &mut Context<Self>) {
        let vista = cx.entity().downgrade();
        let hoy = FechaCivil::hoy_utc();
        let id = tarea.id;
        let abierta = tarea.estado.is_abierta();
        window.open_dialog(cx, move |dialog, _, cx| {
            let vista = vista.clone();
            let tarea_dialog = tarea.clone();
            dialog
                .title(tarea_dialog.titulo.clone())
                .w(px(540.))
                .close_button(true)
                .child(
                    v_flex()
                        .id("cal-detalle-scroll")
                        .max_h(px(480.))
                        .overflow_y_scroll()
                        .child(detalle_tarea_solo_lectura(&tarea_dialog, hoy, cx)),
                )
                .footer(
                    h_flex()
                        .w_full()
                        .justify_end()
                        .gap_2()
                        .when(abierta, |f| {
                            let vista = vista.clone();
                            f.child(
                                Button::new("cal-completar-detalle")
                                    .primary()
                                    .icon(IconName::Check)
                                    .label("Marcar como completada")
                                    .on_click(move |_, window, cx| {
                                        window.close_dialog(cx);
                                        vista
                                            .update(cx, |v, cx| v.completar_tarea(id, window, cx))
                                            .ok();
                                    }),
                            )
                        })
                        .child(
                            Button::new("cal-cerrar-detalle")
                                .outline()
                                .label("Cerrar")
                                .on_click(|_, window, cx| window.close_dialog(cx)),
                        ),
                )
        });
    }

    fn render_cuadricula(&self, hoy: FechaCivil, cx: &mut Context<Self>) -> impl IntoElement {
        let dias = cuadricula_mes(self.anio, self.mes);
        let filas: Vec<Vec<FechaCivil>> = dias.chunks(7).map(|c| c.to_vec()).collect();

        v_flex()
            .flex_1()
            .min_w_0()
            .h_full()
            .p_5()
            .gap_4()
            .child(
                h_flex()
                    .justify_between()
                    .gap_3()
                    .child(
                        h_flex()
                            .gap_2p5()
                            .items_center()
                            .child(div().text_xl().font_semibold().child(format!(
                                "{} {}",
                                nombre_mes(self.mes),
                                self.anio
                            )))
                            .when(self.cargando, |d| d.child(Spinner::new().small())),
                    )
                    .child(
                        h_flex()
                            .gap_1p5()
                            .child(
                                Button::new("cal-hoy")
                                    .small()
                                    .outline()
                                    .label("Hoy")
                                    .on_click(
                                        cx.listener(|this, _, window, cx| {
                                            this.ir_a_hoy(window, cx)
                                        }),
                                    ),
                            )
                            .child(
                                Button::new("cal-anterior")
                                    .small()
                                    .outline()
                                    .icon(IconName::ChevronLeft)
                                    .tooltip("Mes anterior")
                                    .on_click(cx.listener(|this, _, window, cx| {
                                        this.mover(-1, window, cx)
                                    })),
                            )
                            .child(
                                Button::new("cal-siguiente")
                                    .small()
                                    .outline()
                                    .icon(IconName::ChevronRight)
                                    .tooltip("Mes siguiente")
                                    .on_click(
                                        cx.listener(|this, _, window, cx| {
                                            this.mover(1, window, cx)
                                        }),
                                    ),
                            )
                            .child(
                                Button::new("cal-recargar")
                                    .small()
                                    .ghost()
                                    .icon(IconName::RefreshCw)
                                    .tooltip("Recargar calendario")
                                    .on_click(
                                        cx.listener(|this, _, window, cx| this.cargar(window, cx)),
                                    ),
                            ),
                    ),
            )
            .child(
                h_flex()
                    .gap_1p5()
                    .children(DIAS_SEMANA_CORTOS.into_iter().map(|d| {
                        div()
                            .flex_1()
                            .text_center()
                            .text_xs()
                            .font_medium()
                            .text_color(cx.theme().muted_foreground)
                            .child(d)
                    })),
            )
            .child(v_flex().flex_1().min_h_0().gap_1p5().children(
                filas.into_iter().enumerate().map(|(fila_ix, semana)| {
                    h_flex()
                        .id(("cal-semana", fila_ix as u64))
                        .flex_1()
                        .min_h_0()
                        .items_stretch()
                        .gap_1p5()
                        .children(semana.into_iter().map(|fecha| {
                            let clave = fecha.formatear();
                            let tareas = self.por_dia.get(&clave);
                            let total_dia = tareas.map_or(0, Vec::len);
                            let del_mes = fecha.mes == self.mes && fecha.anio == self.anio;
                            let es_hoy = fecha == hoy;
                            let seleccionada = fecha == self.seleccionado;
                            let vencida = fecha < hoy && total_dia > 0;
                            let previews: Vec<String> = tareas
                                .map(|lista| {
                                    lista.iter().take(2).map(|t| t.titulo.clone()).collect()
                                })
                                .unwrap_or_default();

                            v_flex()
                                .id(("cal-dia", fecha.clave_id()))
                                .flex_1()
                                .min_w_0()
                                .min_h_0()
                                .p_2()
                                .gap_1()
                                .rounded(cx.theme().radius)
                                .border_1()
                                .border_color(if seleccionada {
                                    cx.theme().primary
                                } else {
                                    cx.theme().border.opacity(0.6)
                                })
                                .when(seleccionada, |d| d.bg(cx.theme().accent.opacity(0.45)))
                                .when(!seleccionada && !del_mes, |d| {
                                    d.bg(cx.theme().muted.opacity(0.25))
                                })
                                .hover(|d| d.bg(cx.theme().accent.opacity(0.35)))
                                .on_click(cx.listener(move |this, _, window, cx| {
                                    this.seleccionar_dia(fecha, window, cx);
                                }))
                                .child(
                                    h_flex()
                                        .justify_between()
                                        .items_center()
                                        .child(
                                            div()
                                                .size_6()
                                                .flex()
                                                .items_center()
                                                .justify_center()
                                                .rounded_full()
                                                .text_xs()
                                                .font_medium()
                                                .when(es_hoy, |d| {
                                                    d.bg(cx.theme().primary)
                                                        .text_color(cx.theme().primary_foreground)
                                                })
                                                .when(!es_hoy && !del_mes, |d| {
                                                    d.text_color(cx.theme().muted_foreground)
                                                })
                                                .child(fecha.dia.to_string()),
                                        )
                                        .when(total_dia > 0, |d| {
                                            d.child(
                                                div()
                                                    .px_1p5()
                                                    .rounded_full()
                                                    .text_xs()
                                                    .font_medium()
                                                    .bg(if vencida {
                                                        cx.theme().danger.opacity(0.15)
                                                    } else {
                                                        cx.theme().primary.opacity(0.15)
                                                    })
                                                    .text_color(if vencida {
                                                        cx.theme().danger
                                                    } else {
                                                        cx.theme().primary
                                                    })
                                                    .child(total_dia.to_string()),
                                            )
                                        }),
                                )
                                .child(
                                    v_flex()
                                        .flex_1()
                                        .min_h_0()
                                        .overflow_hidden()
                                        .gap_0p5()
                                        .children(previews.into_iter().map(|titulo| {
                                            div()
                                                .px_1p5()
                                                .py_0p5()
                                                .rounded(cx.theme().radius / 2.)
                                                .bg(if vencida {
                                                    cx.theme().danger.opacity(0.12)
                                                } else {
                                                    cx.theme().secondary
                                                })
                                                .text_xs()
                                                .truncate()
                                                .child(titulo)
                                        }))
                                        .when(total_dia > 2, |d| {
                                            d.child(
                                                div()
                                                    .text_xs()
                                                    .text_color(cx.theme().muted_foreground)
                                                    .child(format!("+{} más", total_dia - 2)),
                                            )
                                        }),
                                )
                        }))
                }),
            ))
    }

    fn render_panel_dia(&self, hoy: FechaCivil, cx: &mut Context<Self>) -> impl IntoElement {
        let clave = self.seleccionado.formatear();
        let tareas_dia = self.por_dia.get(&clave).cloned().unwrap_or_default();
        let es_hoy = self.seleccionado == hoy;
        let filas_dia: Vec<AnyElement> = tareas_dia
            .into_iter()
            .map(|t| self.fila_dia(t, hoy, cx).into_any_element())
            .collect();

        v_flex()
            .w(px(360.))
            .flex_shrink_0()
            .h_full()
            .border_l_1()
            .border_color(cx.theme().border)
            .child(
                v_flex()
                    .p_4()
                    .gap_1()
                    .border_b_1()
                    .border_color(cx.theme().border)
                    .child(
                        h_flex()
                            .justify_between()
                            .items_center()
                            .gap_2()
                            .child(
                                div()
                                    .flex_1()
                                    .min_w_0()
                                    .text_base()
                                    .font_semibold()
                                    .truncate()
                                    .child(self.seleccionado.etiqueta_larga()),
                            )
                            .when(es_hoy, |d| {
                                d.child(
                                    div()
                                        .px_2()
                                        .py_0p5()
                                        .rounded_full()
                                        .text_xs()
                                        .font_medium()
                                        .bg(cx.theme().primary.opacity(0.15))
                                        .text_color(cx.theme().primary)
                                        .child("Hoy"),
                                )
                            }),
                    )
                    .child(
                        div()
                            .text_xs()
                            .text_color(cx.theme().muted_foreground)
                            .child(match filas_dia.len() {
                                0 => "Sin tareas abiertas".to_string(),
                                1 => "1 tarea abierta".to_string(),
                                n => format!("{n} tareas abiertas"),
                            }),
                    ),
            )
            .child(
                v_flex()
                    .id("cal-lista-dia")
                    .flex_1()
                    .min_h_0()
                    .overflow_y_scroll()
                    .p_3()
                    .gap_2()
                    .map(|d| {
                        let vacia = filas_dia.is_empty();
                        match (&self.error, self.cargando, vacia) {
                            (Some(e), _, _) => d.child(
                                v_flex()
                                    .gap_3()
                                    .child(Alert::error("cal-error", e.clone()))
                                    .child(
                                        Button::new("cal-reintentar")
                                            .small()
                                            .outline()
                                            .label("Reintentar")
                                            .on_click(cx.listener(|this, _, window, cx| {
                                                this.cargar(window, cx)
                                            })),
                                    ),
                            ),
                            (None, true, true) => {
                                d.child(div().p_6().flex().justify_center().child(Spinner::new()))
                            }
                            (None, false, true) => d.child(
                                v_flex()
                                    .p_6()
                                    .gap_2()
                                    .items_center()
                                    .text_center()
                                    .text_color(cx.theme().muted_foreground)
                                    .child(Icon::new(IconName::Calendar).size_6())
                                    .child(div().text_sm().font_medium().child("Día libre"))
                                    .child(
                                        div()
                                            .text_xs()
                                            .child("No hay tareas abiertas para este día."),
                                    ),
                            ),
                            _ => d.children(filas_dia),
                        }
                    }),
            )
    }

    fn fila_dia(&self, t: Tarea, hoy: FechaCivil, cx: &mut Context<Self>) -> impl IntoElement {
        let id = t.id;
        let completada = t.estado == EstadoTarea::Completada;
        let (vence_txt, urgencia) =
            etiqueta_vencimiento(t.fecha_vencimiento.as_deref(), t.estado.is_abierta(), hoy);
        let color_vence = match urgencia {
            UrgenciaVencimiento::Vencida => cx.theme().danger,
            UrgenciaVencimiento::HoyOManana => cx.theme().warning,
            UrgenciaVencimiento::Normal => cx.theme().muted_foreground,
        };
        let tarea_detalle = t.clone();

        h_flex()
            .id(("cal-tarea", id as u64))
            .gap_2p5()
            .p_2p5()
            .rounded(cx.theme().radius)
            .border_1()
            .border_color(cx.theme().border)
            .hover(|d| d.bg(cx.theme().accent.opacity(0.45)))
            .on_click(cx.listener(move |this, _, window, cx| {
                this.abrir_detalle(tarea_detalle.clone(), window, cx);
            }))
            .child(
                Checkbox::new(("cal-check", id as u64))
                    .checked(completada)
                    .on_click(cx.listener(move |this, marcada: &bool, window, cx| {
                        if *marcada {
                            this.completar_tarea(id, window, cx);
                        }
                    })),
            )
            .child(
                v_flex()
                    .flex_1()
                    .min_w_0()
                    .gap_1()
                    .child(
                        div()
                            .text_sm()
                            .font_medium()
                            .truncate()
                            .when(completada, |d| {
                                d.line_through().text_color(cx.theme().muted_foreground)
                            })
                            .child(t.titulo),
                    )
                    .child(
                        h_flex()
                            .gap_2()
                            .text_xs()
                            .text_color(cx.theme().muted_foreground)
                            .when(t.prioridad == Prioridad::Alta, |d| {
                                d.child(div().text_color(cx.theme().danger).child("● Alta"))
                            })
                            .child(div().text_color(color_vence).child(vence_txt))
                            .when(t.estado == EstadoTarea::EnProgreso, |d| {
                                d.child("· En progreso")
                            })
                            .when(
                                t.organizacion_id.is_some() || t.proyecto_id.is_some(),
                                |d| d.child("· Compartida"),
                            ),
                    ),
            )
    }
}

impl Render for CalendarioView {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let hoy = FechaCivil::hoy_utc();
        h_flex()
            .items_stretch()
            .size_full()
            .child(self.render_cuadricula(hoy, cx))
            .child(self.render_panel_dia(hoy, cx))
    }
}

#[cfg(test)]
mod tests {
    use super::{
        FechaCivil, UrgenciaVencimiento, agrupar_tareas_por_dia, cuadricula_mes,
        etiqueta_vencimiento, mover_mes,
    };
    use crate::modelos::{EstadoTarea, Prioridad, Subtarea, Tarea};

    fn tarea_demo(
        id: i64,
        estado: EstadoTarea,
        vencimiento: Option<&str>,
        inicio: Option<&str>,
    ) -> Tarea {
        Tarea {
            id,
            titulo: format!("Tarea {id}"),
            contenido: String::new(),
            estado,
            prioridad: Prioridad::Media,
            fecha_inicio: inicio.map(str::to_string),
            fecha_vencimiento: vencimiento.map(str::to_string),
            color: None,
            is_fijada: false,
            tag_ids: vec![],
            responsable_ids: vec![],
            organizacion_id: None,
            proyecto_id: None,
            subtareas: Vec::<Subtarea>::new(),
            bloqueada: false,
        }
    }

    #[test]
    fn parsea_y_formatea_fechas_civiles() {
        let f = FechaCivil::parsear("2024-02-29T10:30:00Z").unwrap();
        assert_eq!(f.formatear(), "2024-02-29");
        assert!(FechaCivil::parsear("2025-02-29").is_none());
        assert!(FechaCivil::parsear("2026-13-01").is_none());
        assert!(FechaCivil::parsear("invalida").is_none());
    }

    #[test]
    fn cuadricula_cubre_semanas_completas_de_lunes_a_domingo() {
        let dias = cuadricula_mes(2026, 11);
        assert_eq!(dias.len() % 7, 0);
        assert_eq!(dias.first().unwrap().dia_semana_lunes0(), 0);
        assert_eq!(dias.last().unwrap().dia_semana_lunes0(), 6);
        assert!(dias.contains(&FechaCivil {
            anio: 2026,
            mes: 11,
            dia: 1
        }));
        assert!(dias.contains(&FechaCivil {
            anio: 2026,
            mes: 11,
            dia: 30
        }));
    }

    #[test]
    fn mueve_meses_cruzando_anio() {
        assert_eq!(mover_mes(2026, 1, -1), (2025, 12));
        assert_eq!(mover_mes(2026, 12, 1), (2027, 1));
    }

    #[test]
    fn calcula_etiquetas_de_vencimiento() {
        let hoy = FechaCivil {
            anio: 2026,
            mes: 11,
            dia: 24,
        };
        assert_eq!(
            etiqueta_vencimiento(None, true, hoy),
            ("Sin fecha".into(), UrgenciaVencimiento::Normal)
        );
        assert_eq!(
            etiqueta_vencimiento(Some("2026-11-23"), true, hoy),
            ("Vencida · 2026-11-23".into(), UrgenciaVencimiento::Vencida)
        );
        assert_eq!(
            etiqueta_vencimiento(Some("2026-11-24"), true, hoy),
            ("Hoy".into(), UrgenciaVencimiento::HoyOManana)
        );
        assert_eq!(
            etiqueta_vencimiento(Some("2026-11-25"), true, hoy),
            ("Mañana".into(), UrgenciaVencimiento::HoyOManana)
        );
        assert_eq!(
            etiqueta_vencimiento(Some("2026-11-23"), false, hoy),
            ("2026-11-23".into(), UrgenciaVencimiento::Normal)
        );
    }

    #[test]
    fn agrupa_solo_tareas_abiertas_por_vencimiento_o_inicio() {
        let tareas = vec![
            tarea_demo(
                1,
                EstadoTarea::Pendiente,
                Some("2026-11-24"),
                Some("2026-11-20"),
            ),
            tarea_demo(2, EstadoTarea::EnProgreso, None, Some("2026-11-25")),
            tarea_demo(3, EstadoTarea::Completada, Some("2026-11-24"), None),
            tarea_demo(4, EstadoTarea::Cancelada, Some("2026-11-24"), None),
            tarea_demo(5, EstadoTarea::Pendiente, None, None),
        ];
        let mapa = agrupar_tareas_por_dia(tareas);
        assert_eq!(mapa.len(), 2);
        assert_eq!(
            mapa["2026-11-24"].iter().map(|t| t.id).collect::<Vec<_>>(),
            vec![1]
        );
        assert_eq!(
            mapa["2026-11-25"].iter().map(|t| t.id).collect::<Vec<_>>(),
            vec![2]
        );
    }
}
