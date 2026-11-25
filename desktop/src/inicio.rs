//! Inicio (dashboard): pendientes agrupadas por vencimiento, resumen, accesos rápidos y detalle.

use gpui_kit::assets::IconName;
use gpui_kit::component::*;
use gpui_kit::component::{
    ActiveTheme,
    alert::Alert,
    button::{Button, ButtonVariants as _},
    checkbox::Checkbox,
    notification::Notification,
    spinner::Spinner,
    tab::TabBar,
};
use gpui_kit::prelude::FluentBuilder as _;
use gpui_kit::*;
use serde_json::json;

use crate::calendario::{
    FechaCivil, UrgenciaVencimiento, detalle_tarea_solo_lectura, etiqueta_vencimiento,
};
use crate::espacio::{IrACalendario, IrANotas, IrANotificaciones, IrAOrganizaciones, IrATareas};
use crate::modelos::{EstadoTarea, Pagina, Prioridad, Tarea};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum FiltroInicio {
    Todas,
    Atrasadas,
    Hoy,
    Proximas,
    SinFecha,
}

impl FiltroInicio {
    const TODOS: [Self; 5] = [
        Self::Todas,
        Self::Atrasadas,
        Self::Hoy,
        Self::Proximas,
        Self::SinFecha,
    ];

    fn etiqueta(self) -> &'static str {
        match self {
            Self::Todas => "Todas",
            Self::Atrasadas => "Atrasadas",
            Self::Hoy => "Hoy",
            Self::Proximas => "Próximas",
            Self::SinFecha => "Sin fecha",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct ResumenInicio {
    total_abiertas: i64,
    atrasadas: usize,
    para_hoy: usize,
    proximas: usize,
    sin_fecha: usize,
    prioridad_alta: usize,
    en_progreso: usize,
}

#[derive(Debug)]
struct GruposInicio<'a> {
    atrasadas: Vec<&'a Tarea>,
    hoy: Vec<&'a Tarea>,
    proximas: Vec<&'a Tarea>,
    sin_fecha: Vec<&'a Tarea>,
}

fn clasificar_pendientes<'a>(tareas: &'a [Tarea], hoy: FechaCivil) -> GruposInicio<'a> {
    let mut grupos = GruposInicio {
        atrasadas: vec![],
        hoy: vec![],
        proximas: vec![],
        sin_fecha: vec![],
    };
    for t in tareas {
        match t.fecha_vencimiento.as_deref().and_then(FechaCivil::parsear) {
            Some(vence) if vence < hoy => grupos.atrasadas.push(t),
            Some(vence) if vence == hoy => grupos.hoy.push(t),
            Some(_) => grupos.proximas.push(t),
            None => grupos.sin_fecha.push(t),
        }
    }
    grupos
}

fn calcular_resumen(tareas: &[Tarea], total: i64, hoy: FechaCivil) -> ResumenInicio {
    let grupos = clasificar_pendientes(tareas, hoy);
    ResumenInicio {
        total_abiertas: total.max(tareas.len() as i64),
        atrasadas: grupos.atrasadas.len(),
        para_hoy: grupos.hoy.len(),
        proximas: grupos.proximas.len(),
        sin_fecha: grupos.sin_fecha.len(),
        prioridad_alta: tareas
            .iter()
            .filter(|t| t.prioridad == Prioridad::Alta)
            .count(),
        en_progreso: tareas
            .iter()
            .filter(|t| t.estado == EstadoTarea::EnProgreso)
            .count(),
    }
}

pub struct InicioView {
    tareas: Vec<Tarea>,
    total: i64,
    filtro: FiltroInicio,
    seleccion: Option<i64>,
    cargando: bool,
    error: Option<SharedString>,
    revision: u64,
}

impl InicioView {
    pub fn new(window: &mut Window, cx: &mut Context<Self>) -> Self {
        let mut vista = Self {
            tareas: vec![],
            total: 0,
            filtro: FiltroInicio::Todas,
            seleccion: None,
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

        let api = crate::api(cx);
        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(async move {
                    api.get::<Pagina<Tarea>>("/tareas/pendientes?limite=100")
                })
                .await;
            this.update(cx, |this, cx| {
                if this.revision != revision {
                    return;
                }
                this.cargando = false;
                match r {
                    Ok(p) => {
                        this.total = p.total_elementos;
                        this.tareas = p.datos;
                        if !this.tareas.iter().any(|t| Some(t.id) == this.seleccion) {
                            this.seleccion = this.tareas.first().map(|t| t.id);
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

    fn completar_tarea(&mut self, id: i64, window: &mut Window, cx: &mut Context<Self>) {
        let api = crate::api(cx);
        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(async move {
                    api.put::<Tarea>(&format!("/tareas/{id}"), json!({ "estado": "completada" }))
                })
                .await;
            this.update_in(cx, |this, window, cx| {
                match r {
                    Ok(_) => {
                        this.tareas.retain(|t| t.id != id);
                        this.total = (this.total - 1).max(0);
                        if this.seleccion == Some(id) {
                            this.seleccion = this.tareas.first().map(|t| t.id);
                        }
                        window.push_notification(Notification::success("Tarea completada."), cx);
                    }
                    Err(e) => window.push_notification(Notification::error(e.mensaje), cx),
                }
                cx.notify();
            })
            .ok();
        })
        .detach();
    }

    /// Mismo editor completo que en Tareas; al guardar se recarga el resumen.
    fn abrir_nueva_tarea(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        let vista = cx.entity().downgrade();
        crate::editor_tarea::abrir(
            None,
            crate::editor_tarea::Ambito::default(),
            crate::modelos::EstadoTarea::Pendiente,
            move |_, window, cx| {
                vista.update(cx, |v, cx| v.cargar(window, cx)).ok();
            },
            window,
            cx,
        );
    }

    fn render_cabecera(&self, resumen: &ResumenInicio, cx: &mut Context<Self>) -> impl IntoElement {
        let subtitulo = match resumen.total_abiertas {
            0 => "Sin tareas abiertas por ahora".to_string(),
            1 => "1 tarea abierta".to_string(),
            n => format!("{n} tareas abiertas"),
        };

        h_flex()
            .justify_between()
            .items_center()
            .gap_3()
            .px_6()
            .pt_5()
            .pb_3()
            .child(
                v_flex()
                    .gap_0p5()
                    .child(div().text_2xl().font_semibold().child("Inicio"))
                    .child(
                        div()
                            .text_sm()
                            .text_color(cx.theme().muted_foreground)
                            .child(subtitulo),
                    ),
            )
            .child(
                h_flex()
                    .gap_2()
                    .child(
                        Button::new("inicio-recargar")
                            .outline()
                            .small()
                            .icon(IconName::RefreshCw)
                            .label("Recargar")
                            .on_click(cx.listener(|this, _, window, cx| this.cargar(window, cx))),
                    )
                    .child(
                        Button::new("inicio-nueva")
                            .primary()
                            .small()
                            .icon(IconName::Plus)
                            .label("Nueva tarea")
                            .on_click(cx.listener(|this, _, window, cx| {
                                this.abrir_nueva_tarea(window, cx)
                            })),
                    ),
            )
    }

    fn render_tarjetas_resumen(
        &self,
        resumen: &ResumenInicio,
        cx: &mut Context<Self>,
    ) -> impl IntoElement {
        let en_progreso_txt = match resumen.en_progreso {
            0 => "Listas para trabajar".to_string(),
            1 => "1 en progreso".to_string(),
            n => format!("{n} en progreso"),
        };
        let tarjeta = |id: &'static str,
                       titulo: &'static str,
                       valor: String,
                       pie: String,
                       acento: Option<Hsla>,
                       filtro: FiltroInicio| {
            let activa = self.filtro == filtro;
            v_flex()
                .id(id)
                .flex_1()
                .min_w_0()
                .p_3()
                .gap_1()
                .rounded(cx.theme().radius)
                .border_1()
                .border_color(if activa {
                    cx.theme().primary
                } else {
                    cx.theme().border
                })
                .bg(if activa {
                    cx.theme().accent.opacity(0.4)
                } else {
                    cx.theme().muted.opacity(0.2)
                })
                .hover(|d| d.bg(cx.theme().accent.opacity(0.35)))
                .on_click(cx.listener(move |this, _, _, cx| {
                    this.filtro = filtro;
                    cx.notify();
                }))
                .child(
                    div()
                        .text_xs()
                        .text_color(cx.theme().muted_foreground)
                        .child(titulo),
                )
                .child(
                    div()
                        .text_2xl()
                        .font_semibold()
                        .when_some(acento, |d, c| d.text_color(c))
                        .child(valor),
                )
                .child(
                    div()
                        .text_xs()
                        .truncate()
                        .text_color(cx.theme().muted_foreground)
                        .child(pie),
                )
        };

        h_flex()
            .gap_3()
            .px_6()
            .pb_3()
            .child(tarjeta(
                "kpi-abiertas",
                "Abiertas",
                resumen.total_abiertas.to_string(),
                en_progreso_txt,
                None,
                FiltroInicio::Todas,
            ))
            .child(tarjeta(
                "kpi-atrasadas",
                "Atrasadas",
                resumen.atrasadas.to_string(),
                if resumen.atrasadas == 0 {
                    "Al día".into()
                } else {
                    "Requieren atención".into()
                },
                (resumen.atrasadas > 0).then_some(cx.theme().danger),
                FiltroInicio::Atrasadas,
            ))
            .child(tarjeta(
                "kpi-hoy",
                "Para hoy",
                resumen.para_hoy.to_string(),
                format!("{} próximas", resumen.proximas),
                (resumen.para_hoy > 0).then_some(cx.theme().warning),
                FiltroInicio::Hoy,
            ))
            .child(tarjeta(
                "kpi-alta",
                "Prioridad alta",
                resumen.prioridad_alta.to_string(),
                format!("{} sin fecha", resumen.sin_fecha),
                (resumen.prioridad_alta > 0).then_some(cx.theme().danger),
                FiltroInicio::SinFecha,
            ))
    }

    fn render_accesos_rapidos(&self, cx: &mut Context<Self>) -> impl IntoElement {
        let acceso =
            |id: &'static str, etiqueta: &'static str, icono: IconName, accion: Box<dyn Action>| {
                Button::new(id)
                    .small()
                    .ghost()
                    .icon(icono)
                    .label(etiqueta)
                    .on_click(move |_, window, cx| {
                        window.dispatch_action(accion.boxed_clone(), cx);
                    })
            };

        h_flex()
            .gap_1p5()
            .px_6()
            .pb_3()
            .border_b_1()
            .border_color(cx.theme().border)
            .child(
                div()
                    .text_xs()
                    .text_color(cx.theme().muted_foreground)
                    .pr_1()
                    .child("Accesos:"),
            )
            .child(acceso(
                "acceso-tareas",
                "Tareas",
                IconName::SquareCheck,
                Box::new(IrATareas),
            ))
            .child(acceso(
                "acceso-calendario",
                "Calendario",
                IconName::Calendar,
                Box::new(IrACalendario),
            ))
            .child(acceso(
                "acceso-notas",
                "Notas",
                IconName::BookOpen,
                Box::new(IrANotas),
            ))
            .child(acceso(
                "acceso-organizaciones",
                "Organizaciones",
                IconName::Building2,
                Box::new(IrAOrganizaciones),
            ))
            .child(acceso(
                "acceso-notificaciones",
                "Notificaciones",
                IconName::Bell,
                Box::new(IrANotificaciones),
            ))
    }

    fn fila_tarea(&self, t: &Tarea, hoy: FechaCivil, cx: &mut Context<Self>) -> impl IntoElement {
        let id = t.id;
        let seleccionada = self.seleccion == Some(id);
        let completada = t.estado == EstadoTarea::Completada;
        let (vence_txt, urgencia) =
            etiqueta_vencimiento(t.fecha_vencimiento.as_deref(), t.estado.is_abierta(), hoy);
        let color_vence = match urgencia {
            UrgenciaVencimiento::Vencida => cx.theme().danger,
            UrgenciaVencimiento::HoyOManana => cx.theme().warning,
            UrgenciaVencimiento::Normal => cx.theme().muted_foreground,
        };

        h_flex()
            .id(("inicio-tarea", id as u64))
            .gap_2p5()
            .px_3()
            .py_2()
            .rounded(cx.theme().radius)
            .when(seleccionada, |d| d.bg(cx.theme().accent))
            .hover(|d| d.bg(cx.theme().accent.opacity(0.6)))
            .on_click(cx.listener(move |this, _, _, cx| {
                this.seleccion = Some(id);
                cx.notify();
            }))
            .child(
                Checkbox::new(("inicio-check", id as u64))
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
                    .gap_0p5()
                    .child(
                        div()
                            .text_sm()
                            .font_medium()
                            .truncate()
                            .when(completada, |d| {
                                d.line_through().text_color(cx.theme().muted_foreground)
                            })
                            .child(t.titulo.clone()),
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
                            .when(t.bloqueada, |d| d.child("· Bloqueada"))
                            .when(
                                t.organizacion_id.is_some() || t.proyecto_id.is_some(),
                                |d| d.child("· Compartida"),
                            ),
                    ),
            )
    }

    fn render_seccion_grupo(
        &self,
        id: &'static str,
        titulo: &'static str,
        tareas: &[&Tarea],
        hoy: FechaCivil,
        acento: Option<Hsla>,
        cx: &mut Context<Self>,
    ) -> Option<AnyElement> {
        if tareas.is_empty() {
            return None;
        }
        let filas: Vec<AnyElement> = tareas
            .iter()
            .map(|t| self.fila_tarea(t, hoy, cx).into_any_element())
            .collect();
        Some(
            v_flex()
                .id(id)
                .gap_1()
                .child(
                    h_flex()
                        .px_3()
                        .pt_2()
                        .pb_1()
                        .justify_between()
                        .child(
                            div()
                                .text_xs()
                                .font_semibold()
                                .when_some(acento, |d, c| d.text_color(c))
                                .child(titulo),
                        )
                        .child(
                            div()
                                .text_xs()
                                .text_color(cx.theme().muted_foreground)
                                .child(tareas.len().to_string()),
                        ),
                )
                .children(filas)
                .into_any_element(),
        )
    }

    fn render_lista(&self, hoy: FechaCivil, cx: &mut Context<Self>) -> impl IntoElement {
        let indice = FiltroInicio::TODOS
            .iter()
            .position(|f| *f == self.filtro)
            .unwrap_or(0);
        let grupos = clasificar_pendientes(&self.tareas, hoy);

        let secciones: Vec<AnyElement> = match self.filtro {
            FiltroInicio::Todas => [
                self.render_seccion_grupo(
                    "sec-atrasadas",
                    "ATRASADAS",
                    &grupos.atrasadas,
                    hoy,
                    Some(cx.theme().danger),
                    cx,
                ),
                self.render_seccion_grupo(
                    "sec-hoy",
                    "HOY",
                    &grupos.hoy,
                    hoy,
                    Some(cx.theme().warning),
                    cx,
                ),
                self.render_seccion_grupo(
                    "sec-proximas",
                    "PRÓXIMAS",
                    &grupos.proximas,
                    hoy,
                    None,
                    cx,
                ),
                self.render_seccion_grupo(
                    "sec-sin-fecha",
                    "SIN FECHA",
                    &grupos.sin_fecha,
                    hoy,
                    None,
                    cx,
                ),
            ]
            .into_iter()
            .flatten()
            .collect(),
            FiltroInicio::Atrasadas => self
                .render_seccion_grupo(
                    "sec-atrasadas",
                    "ATRASADAS",
                    &grupos.atrasadas,
                    hoy,
                    Some(cx.theme().danger),
                    cx,
                )
                .into_iter()
                .collect(),
            FiltroInicio::Hoy => self
                .render_seccion_grupo(
                    "sec-hoy",
                    "HOY",
                    &grupos.hoy,
                    hoy,
                    Some(cx.theme().warning),
                    cx,
                )
                .into_iter()
                .collect(),
            FiltroInicio::Proximas => self
                .render_seccion_grupo("sec-proximas", "PRÓXIMAS", &grupos.proximas, hoy, None, cx)
                .into_iter()
                .collect(),
            FiltroInicio::SinFecha => self
                .render_seccion_grupo(
                    "sec-sin-fecha",
                    "SIN FECHA",
                    &grupos.sin_fecha,
                    hoy,
                    None,
                    cx,
                )
                .into_iter()
                .collect(),
        };

        v_flex()
            .flex_1()
            .min_w_0()
            .h_full()
            .child(
                div().px_6().py_3().child(
                    TabBar::new("filtro-inicio")
                        .segmented()
                        .small()
                        .selected_index(indice)
                        .children(FiltroInicio::TODOS.map(|f| f.etiqueta()))
                        .on_click(cx.listener(|this, i: &usize, _, cx| {
                            if let Some(f) = FiltroInicio::TODOS.get(*i).copied() {
                                this.filtro = f;
                                cx.notify();
                            }
                        })),
                ),
            )
            .child(
                v_flex()
                    .id("inicio-lista")
                    .flex_1()
                    .min_h_0()
                    .overflow_y_scroll()
                    .px_3()
                    .pb_4()
                    .gap_2()
                    .map(
                        |d| {
                            match (&self.error, self.cargando, secciones.is_empty()) {
                        (Some(e), _, _) => d.child(
                            v_flex()
                                .p_3()
                                .gap_3()
                                .child(Alert::error("inicio-error", e.clone()))
                                .child(
                                    Button::new("inicio-reintentar")
                                        .small()
                                        .outline()
                                        .label("Reintentar")
                                        .on_click(cx.listener(|this, _, window, cx| {
                                            this.cargar(window, cx)
                                        })),
                                ),
                        ),
                        (None, true, true) => {
                            d.child(div().p_8().flex().justify_center().child(Spinner::new()))
                        }
                        (None, false, true) => d.child(
                            v_flex()
                                .p_8()
                                .gap_2()
                                .items_center()
                                .text_center()
                                .text_color(cx.theme().muted_foreground)
                                .child(Icon::new(IconName::CircleCheck).size_6())
                                .child(div().text_sm().font_medium().child("Nada pendiente"))
                                .child(
                                    div().text_xs().child(if self.filtro == FiltroInicio::Todas {
                                        "Crea una tarea y aparecerá aquí, ordenada por vencimiento."
                                    } else {
                                        "No hay tareas en esta categoría."
                                    }),
                                )
                                .when(self.filtro == FiltroInicio::Todas, |v| {
                                    v.child(
                                        Button::new("inicio-vacio-nueva")
                                            .small()
                                            .outline()
                                            .icon(IconName::Plus)
                                            .label("Nueva tarea")
                                            .on_click(cx.listener(|this, _, window, cx| {
                                                this.abrir_nueva_tarea(window, cx)
                                            })),
                                    )
                                }),
                        ),
                        _ => d.children(secciones),
                    }
                        },
                    ),
            )
    }

    fn render_detalle(&self, hoy: FechaCivil, cx: &mut Context<Self>) -> impl IntoElement {
        let seleccionada = self
            .seleccion
            .and_then(|id| self.tareas.iter().find(|t| t.id == id))
            .cloned();

        v_flex()
            .w(px(360.))
            .flex_shrink_0()
            .h_full()
            .border_l_1()
            .border_color(cx.theme().border)
            .child(match seleccionada {
                Some(t) => {
                    let id = t.id;
                    let abierta = t.estado.is_abierta();
                    v_flex()
                        .id("inicio-detalle")
                        .size_full()
                        .overflow_y_scroll()
                        .p_5()
                        .gap_4()
                        .child(
                            v_flex()
                                .gap_2()
                                .child(div().text_lg().font_semibold().child(t.titulo.clone()))
                                .when(abierta, |v| {
                                    v.child(
                                        Button::new(("inicio-completar-detalle", id as u64))
                                            .small()
                                            .outline()
                                            .icon(IconName::Check)
                                            .label("Marcar como completada")
                                            .on_click(cx.listener(move |this, _, window, cx| {
                                                this.completar_tarea(id, window, cx)
                                            })),
                                    )
                                }),
                        )
                        .child(detalle_tarea_solo_lectura(&t, hoy, cx))
                        .into_any_element()
                }
                None => v_flex()
                    .size_full()
                    .items_center()
                    .justify_center()
                    .p_6()
                    .text_center()
                    .text_color(cx.theme().muted_foreground)
                    .child(
                        v_flex()
                            .items_center()
                            .gap_2()
                            .child(Icon::new(IconName::SquareCheck).size_6())
                            .child(
                                div()
                                    .text_sm()
                                    .child("Selecciona una tarea para ver su detalle"),
                            ),
                    )
                    .into_any_element(),
            })
    }
}

impl Render for InicioView {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let hoy = FechaCivil::hoy_utc();
        let resumen = calcular_resumen(&self.tareas, self.total, hoy);

        v_flex()
            .size_full()
            .child(self.render_cabecera(&resumen, cx))
            .child(self.render_tarjetas_resumen(&resumen, cx))
            .child(self.render_accesos_rapidos(cx))
            .child(
                h_flex()
                    .items_stretch()
                    .flex_1()
                    .min_h_0()
                    .child(self.render_lista(hoy, cx))
                    .child(self.render_detalle(hoy, cx)),
            )
    }
}

#[cfg(test)]
mod tests {
    use super::{calcular_resumen, clasificar_pendientes};
    use crate::calendario::FechaCivil;
    use crate::modelos::{EstadoTarea, Prioridad, Subtarea, Tarea};

    fn tarea(
        id: i64,
        estado: EstadoTarea,
        prioridad: Prioridad,
        vencimiento: Option<&str>,
    ) -> Tarea {
        Tarea {
            id,
            titulo: format!("Tarea {id}"),
            contenido: String::new(),
            estado,
            prioridad,
            fecha_inicio: None,
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
    fn clasifica_pendientes_en_grupos_y_calcula_resumen() {
        let hoy = FechaCivil {
            anio: 2026,
            mes: 11,
            dia: 24,
        };
        let tareas = vec![
            tarea(
                1,
                EstadoTarea::Pendiente,
                Prioridad::Alta,
                Some("2026-11-22"),
            ),
            tarea(
                2,
                EstadoTarea::EnProgreso,
                Prioridad::Media,
                Some("2026-11-24"),
            ),
            tarea(
                3,
                EstadoTarea::Pendiente,
                Prioridad::Baja,
                Some("2026-11-26"),
            ),
            tarea(4, EstadoTarea::Pendiente, Prioridad::Alta, None),
        ];
        let grupos = clasificar_pendientes(&tareas, hoy);
        assert_eq!(
            grupos.atrasadas.iter().map(|t| t.id).collect::<Vec<_>>(),
            vec![1]
        );
        assert_eq!(grupos.hoy.iter().map(|t| t.id).collect::<Vec<_>>(), vec![2]);
        assert_eq!(
            grupos.proximas.iter().map(|t| t.id).collect::<Vec<_>>(),
            vec![3]
        );
        assert_eq!(
            grupos.sin_fecha.iter().map(|t| t.id).collect::<Vec<_>>(),
            vec![4]
        );

        let resumen = calcular_resumen(&tareas, 4, hoy);
        assert_eq!(resumen.total_abiertas, 4);
        assert_eq!(resumen.atrasadas, 1);
        assert_eq!(resumen.para_hoy, 1);
        assert_eq!(resumen.proximas, 1);
        assert_eq!(resumen.sin_fecha, 1);
        assert_eq!(resumen.prioridad_alta, 2);
        assert_eq!(resumen.en_progreso, 1);
    }
}
