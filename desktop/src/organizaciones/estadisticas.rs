//! Pestañas de estadísticas y ajustes de una organización.

use std::collections::HashMap;

use gpui_kit::assets::IconName;
use gpui_kit::component::ActiveTheme;
use gpui_kit::component::button::{Button, ButtonVariants as _};
use gpui_kit::component::*;
use gpui_kit::prelude::FluentBuilder as _;
use gpui_kit::*;

use crate::modelos::{EstadisticasTareas, Organizacion};

use super::OrganizacionesView;
use super::datos::{inicial_texto, parsear_color_hex};
use super::formularios::abrir_dialogo_organizacion;

pub fn render_estadisticas(
    vista: &OrganizacionesView,
    cx: &mut Context<OrganizacionesView>,
) -> AnyElement {
    let nombres: HashMap<i64, String> = vista
        .miembros
        .iter()
        .map(|m| (m.usuario_id, m.nombre.clone()))
        .collect();

    v_flex()
        .id("tab-estadisticas-org")
        .size_full()
        .overflow_y_scroll()
        .p_6()
        .gap_4()
        .child(
            h_flex()
                .gap_3()
                .child(tarjeta_resumen(vista.miembros.len(), "Miembros", cx))
                .child(tarjeta_resumen(vista.equipos.len(), "Equipos", cx))
                .child(tarjeta_resumen(vista.proyectos.len(), "Proyectos", cx)),
        )
        .map(|d| match &vista.estadisticas {
            Some(est) => d.child(tarjeta_estadisticas_tareas(est, &nombres, cx)),
            None => d.child(
                div()
                    .p_4()
                    .text_sm()
                    .text_color(cx.theme().muted_foreground)
                    .child("Sin estadísticas disponibles."),
            ),
        })
        .into_any_element()
}

fn tarjeta_resumen(valor: usize, etiqueta: &'static str, cx: &App) -> impl IntoElement {
    v_flex()
        .flex_1()
        .p_3()
        .gap_0p5()
        .rounded(cx.theme().radius)
        .border_1()
        .border_color(cx.theme().border)
        .child(div().text_xl().font_semibold().child(valor.to_string()))
        .child(
            div()
                .text_xs()
                .text_color(cx.theme().muted_foreground)
                .child(etiqueta),
        )
}

fn tarjeta_estadisticas_tareas(
    est: &EstadisticasTareas,
    nombres: &HashMap<i64, String>,
    cx: &App,
) -> impl IntoElement {
    let total = est.total;
    let sufijo = if total == 1 { "tarea" } else { "tareas" };
    let segmentos = [
        ("Pendiente", est.por_estado.pendiente, cx.theme().warning),
        (
            "En progreso",
            est.por_estado.en_progreso,
            cx.theme().primary,
        ),
        ("Completada", est.por_estado.completada, cx.theme().success),
        ("Cancelada", est.por_estado.cancelada, cx.theme().border),
    ];

    v_flex()
        .p_4()
        .gap_4()
        .rounded(cx.theme().radius)
        .border_1()
        .border_color(cx.theme().border)
        .child(
            v_flex()
                .gap_0p5()
                .child(
                    div()
                        .text_base()
                        .font_semibold()
                        .child("Tareas de la organización"),
                )
                .child(
                    div()
                        .text_xs()
                        .text_color(cx.theme().muted_foreground)
                        .child(format!("{total} {sufijo} en total.")),
                ),
        )
        .child(
            h_flex()
                .gap_2()
                .child(caja_cifra(
                    est.abiertas().to_string(),
                    "Abiertas",
                    false,
                    cx,
                ))
                .child(caja_cifra(
                    est.por_estado.completada.to_string(),
                    "Completadas",
                    false,
                    cx,
                ))
                .child(caja_cifra(
                    est.vencidas.to_string(),
                    "Vencidas",
                    est.vencidas > 0,
                    cx,
                ))
                .child(caja_cifra(
                    format!("{}%", est.porcentaje_avance()),
                    "Avance cerradas",
                    false,
                    cx,
                )),
        )
        .when(total > 0, |d| {
            d.child(
                v_flex()
                    .gap_2()
                    .child(
                        h_flex()
                            .h_2()
                            .w_full()
                            .rounded_full()
                            .overflow_hidden()
                            .bg(cx.theme().muted)
                            .children(segmentos.iter().filter(|(_, v, _)| *v > 0).map(
                                |(_, valor, color)| {
                                    div()
                                        .h_full()
                                        .w(gpui_kit::relative(*valor as f32 / total as f32))
                                        .bg(*color)
                                },
                            )),
                    )
                    .child(h_flex().flex_wrap().gap_3().children(segmentos.iter().map(
                        |(etiq, valor, color)| {
                            h_flex()
                                .gap_1p5()
                                .child(div().size_2().rounded_full().bg(*color))
                                .child(
                                    div()
                                        .text_xs()
                                        .text_color(cx.theme().muted_foreground)
                                        .child(format!("{etiq}: {valor}")),
                                )
                        },
                    ))),
            )
        })
        .child(
            v_flex()
                .gap_1p5()
                .child(
                    div()
                        .text_xs()
                        .font_medium()
                        .text_color(cx.theme().muted_foreground)
                        .child("Abiertas por prioridad"),
                )
                .child(fila_dato(
                    "Alta",
                    est.abiertas_por_prioridad.alta.to_string(),
                    Some(cx.theme().danger),
                    cx,
                ))
                .child(fila_dato(
                    "Media",
                    est.abiertas_por_prioridad.media.to_string(),
                    Some(cx.theme().warning),
                    cx,
                ))
                .child(fila_dato(
                    "Baja",
                    est.abiertas_por_prioridad.baja.to_string(),
                    Some(cx.theme().muted_foreground),
                    cx,
                )),
        )
        .child(
            v_flex()
                .gap_1p5()
                .child(
                    div()
                        .text_xs()
                        .font_medium()
                        .text_color(cx.theme().muted_foreground)
                        .child("Por responsable (abiertas / completadas)"),
                )
                .map(|d| {
                    if est.por_responsable.is_empty() {
                        d.child(
                            div()
                                .text_xs()
                                .text_color(cx.theme().muted_foreground)
                                .child("Sin responsables asignados."),
                        )
                    } else {
                        d.children(est.por_responsable.iter().map(|r| {
                            let nombre = nombres
                                .get(&r.usuario_id)
                                .cloned()
                                .unwrap_or_else(|| "Antiguo miembro".to_string());
                            fila_dato(
                                &nombre,
                                format!("{} / {}", r.abiertas, r.completadas),
                                None,
                                cx,
                            )
                        }))
                    }
                }),
        )
}

fn caja_cifra(valor: String, etiqueta: &'static str, alerta: bool, cx: &App) -> impl IntoElement {
    v_flex()
        .flex_1()
        .p_2p5()
        .gap_0p5()
        .rounded(cx.theme().radius)
        .border_1()
        .border_color(cx.theme().border)
        .child(
            div()
                .text_lg()
                .font_semibold()
                .text_color(if alerta {
                    cx.theme().danger
                } else {
                    cx.theme().foreground
                })
                .child(valor),
        )
        .child(
            div()
                .text_xs()
                .text_color(cx.theme().muted_foreground)
                .child(etiqueta),
        )
}

fn fila_dato(etiqueta: &str, valor: String, punto: Option<Hsla>, cx: &App) -> AnyElement {
    h_flex()
        .justify_between()
        .gap_2()
        .child(
            h_flex()
                .gap_2()
                .min_w_0()
                .flex_1()
                .when_some(punto, |row, c| {
                    row.child(div().size_2().rounded_full().bg(c))
                })
                .child(div().text_sm().truncate().child(etiqueta.to_string())),
        )
        .child(
            div()
                .text_sm()
                .text_color(cx.theme().muted_foreground)
                .child(valor),
        )
        .into_any_element()
}

pub fn render_ajustes(org: &Organizacion, cx: &mut Context<OrganizacionesView>) -> AnyElement {
    let puede_editar = org.puede("organizacion:editar");
    let color_avatar = parsear_color_hex(org.color.as_deref());
    let org_editar = org.clone();
    let org_id = org.id;
    let org_nombre = org.nombre.clone();

    v_flex()
        .id("tab-ajustes-org")
        .size_full()
        .overflow_y_scroll()
        .p_6()
        .gap_4()
        .when(puede_editar, |d| {
            d.child(
                v_flex()
                    .p_4()
                    .gap_3()
                    .rounded(cx.theme().radius)
                    .border_1()
                    .border_color(cx.theme().border)
                    .child(div().text_base().font_semibold().child("Personalización"))
                    .child(
                        h_flex()
                            .gap_3()
                            .child(
                                div()
                                    .size_10()
                                    .rounded_full()
                                    .flex_shrink_0()
                                    .flex()
                                    .items_center()
                                    .justify_center()
                                    .font_semibold()
                                    .map(|av| match color_avatar {
                                        Some(c) => av.bg(c).text_color(gpui_kit::white()),
                                        None => av
                                            .bg(cx.theme().muted)
                                            .text_color(cx.theme().muted_foreground),
                                    })
                                    .child(inicial_texto(&org.nombre, 'O')),
                            )
                            .child(
                                v_flex()
                                    .flex_1()
                                    .min_w_0()
                                    .gap_0p5()
                                    .child(div().text_sm().font_medium().child(org.nombre.clone()))
                                    .when(!org.descripcion.trim().is_empty(), |col| {
                                        col.child(
                                            div()
                                                .text_xs()
                                                .text_color(cx.theme().muted_foreground)
                                                .child(org.descripcion.trim().to_string()),
                                        )
                                    }),
                            ),
                    )
                    .child(
                        Button::new("editar-org-ajustes")
                            .outline()
                            .small()
                            .icon(IconName::Pencil)
                            .label("Editar nombre, descripción y color")
                            .on_click(cx.listener(move |_, _, w, cx| {
                                let weak = cx.entity().downgrade();
                                abrir_dialogo_organizacion(Some(org_editar.clone()), weak, w, cx);
                            })),
                    ),
            )
        })
        .when(org.is_admin, |d| {
            d.child(
                v_flex()
                    .p_4()
                    .gap_3()
                    .rounded(cx.theme().radius)
                    .border_1()
                    .border_color(cx.theme().danger.opacity(0.4))
                    .child(
                        div()
                            .text_base()
                            .font_semibold()
                            .child("Eliminar organización"),
                    )
                    .child(
                        div()
                            .text_xs()
                            .text_color(cx.theme().muted_foreground)
                            .child("Deja de estar disponible para todos sus miembros."),
                    )
                    .child(
                        Button::new("eliminar-org-ajustes")
                            .danger()
                            .small()
                            .icon(IconName::Delete)
                            .label("Eliminar organización")
                            .on_click(cx.listener(move |this, _, w, cx| {
                                this.confirmar_eliminar_organizacion(org_id, &org_nombre, w, cx);
                            })),
                    ),
            )
        })
        .into_any_element()
}
