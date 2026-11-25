//! Pestaña de equipos y detalle de equipo dentro de una organización.

use gpui_kit::assets::IconName;
use gpui_kit::component::ActiveTheme;
use gpui_kit::component::alert::Alert;
use gpui_kit::component::button::{Button, ButtonVariants as _};
use gpui_kit::component::checkbox::Checkbox;
use gpui_kit::component::spinner::Spinner;
use gpui_kit::component::*;
use gpui_kit::prelude::FluentBuilder as _;
use gpui_kit::*;

use crate::editor_tarea::Ambito;
use crate::modelos::{Equipo, EstadoTarea, Organizacion};

use super::OrganizacionesView;
use super::datos::{inicial_texto, parsear_color_hex};
use super::formularios::{abrir_dialogo_delegados, abrir_dialogo_equipo};

pub fn render_equipos(
    vista: &OrganizacionesView,
    org: &Organizacion,
    cx: &mut Context<OrganizacionesView>,
) -> AnyElement {
    if let Some(eid) = vista.equipo_activo
        && let Some(equipo) = vista.equipos.iter().find(|e| e.id == eid)
    {
        return render_detalle_equipo(vista, org, equipo, cx);
    }

    let filtrados: Vec<&Equipo> = match vista.filtro_tag_equipo {
        None => vista.equipos.iter().collect(),
        Some(tid) => vista
            .equipos
            .iter()
            .filter(|e| e.tag_ids.contains(&tid))
            .collect(),
    };
    let mut filas = Vec::with_capacity(filtrados.len());
    for eq in filtrados {
        filas.push(fila_equipo(vista, eq, cx).into_any_element());
    }
    let puede_crear = org.puede("equipos:crear");

    v_flex()
        .size_full()
        .p_6()
        .gap_4()
        .child(
            h_flex()
                .gap_2()
                .justify_between()
                .child(h_flex().flex_1().min_w_0().flex_wrap().gap_1p5().when(
                    !vista.tags.is_empty(),
                    |row| {
                        row.child(
                            Button::new("eq-filtro-todos")
                                .small()
                                .label("Todos")
                                .when(vista.filtro_tag_equipo.is_none(), |b| b.primary())
                                .when(vista.filtro_tag_equipo.is_some(), |b| b.outline())
                                .on_click(cx.listener(|this, _, _, cx| {
                                    this.filtro_tag_equipo = None;
                                    cx.notify();
                                })),
                        )
                        .children(vista.tags.iter().map(|tag| {
                            let tid = tag.id;
                            let sel = vista.filtro_tag_equipo == Some(tid);
                            Button::new(("eq-filtro-tag", tid as u64))
                                .small()
                                .label(tag.nombre.clone())
                                .when(sel, |b| b.primary())
                                .when(!sel, |b| b.outline())
                                .on_click(cx.listener(move |this, _, _, cx| {
                                    this.filtro_tag_equipo = Some(tid);
                                    cx.notify();
                                }))
                        }))
                    },
                ))
                .when(puede_crear, |d| {
                    let org_id = org.id;
                    let miembros = vista.miembros.clone();
                    let tags = vista.tags.clone();
                    d.child(
                        Button::new("nuevo-equipo")
                            .small()
                            .icon(IconName::Plus)
                            .label("Nuevo equipo")
                            .on_click(cx.listener(move |_, _, w, cx| {
                                let weak = cx.entity().downgrade();
                                abrir_dialogo_equipo(
                                    org_id,
                                    None,
                                    miembros.clone(),
                                    tags.clone(),
                                    weak,
                                    w,
                                    cx,
                                );
                            })),
                    )
                }),
        )
        .child(
            v_flex()
                .id("lista-equipos-org")
                .flex_1()
                .min_h_0()
                .overflow_y_scroll()
                .gap_2()
                .map(|d| {
                    if filas.is_empty() {
                        d.child(
                            div()
                                .py_8()
                                .text_sm()
                                .text_color(cx.theme().muted_foreground)
                                .child("No hay equipos en esta organización."),
                        )
                    } else {
                        d.children(filas)
                    }
                }),
        )
        .into_any_element()
}

fn fila_equipo(
    vista: &OrganizacionesView,
    eq: &Equipo,
    cx: &mut Context<OrganizacionesView>,
) -> impl IntoElement {
    let eid = eq.id;
    let color_avatar = parsear_color_hex(eq.color.as_deref());
    let inicial = inicial_texto(&eq.nombre, 'E');
    let lider = eq.lider_id.and_then(|lid| {
        vista
            .miembros
            .iter()
            .find(|m| m.usuario_id == lid)
            .map(|m| m.nombre.as_str())
    });
    let n = eq.miembros.len();
    let mut partes = vec![format!(
        "{n} {}",
        if n == 1 { "integrante" } else { "integrantes" }
    )];
    if let Some(nombre_lider) = lider {
        partes.push(format!("Líder: {nombre_lider}"));
    }
    if !eq.descripcion.trim().is_empty() {
        partes.push(eq.descripcion.trim().to_string());
    }

    h_flex()
        .id(("equipo-org", eid as u64))
        .p_3()
        .gap_3()
        .rounded(cx.theme().radius)
        .border_1()
        .border_color(cx.theme().border)
        .hover(|d| d.bg(cx.theme().accent.opacity(0.4)))
        .on_click(cx.listener(move |this, _, w, cx| {
            this.abrir_equipo(eid, w, cx);
        }))
        .child(
            div()
                .size_8()
                .rounded_full()
                .flex_shrink_0()
                .flex()
                .items_center()
                .justify_center()
                .text_xs()
                .font_semibold()
                .map(|d| match color_avatar {
                    Some(c) => d.bg(c).text_color(gpui_kit::white()),
                    None => d
                        .bg(cx.theme().muted)
                        .text_color(cx.theme().muted_foreground),
                })
                .child(inicial),
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
                        .child(eq.nombre.clone()),
                )
                .child(
                    div()
                        .text_xs()
                        .text_color(cx.theme().muted_foreground)
                        .truncate()
                        .child(partes.join(" · ")),
                ),
        )
        .child(
            Icon::new(IconName::ChevronRight)
                .small()
                .text_color(cx.theme().muted_foreground),
        )
}

fn render_detalle_equipo(
    vista: &OrganizacionesView,
    org: &Organizacion,
    equipo: &Equipo,
    cx: &mut Context<OrganizacionesView>,
) -> AnyElement {
    let eid = equipo.id;
    let org_id = org.id;
    let yo = vista.usuario_actual_id;
    let puede_editar = org.puede("equipos:editar");
    let puede_eliminar = org.puede("equipos:eliminar");
    let puede_delegados = equipo.lider_id.is_some() && (equipo.lider_id == yo || puede_editar);
    let puede_crear_tareas = equipo.puede_crear_tareas(yo);
    let eq_clone = equipo.clone();
    let eq_del = equipo.clone();
    let miembros = vista.miembros.clone();
    let miembros_del = vista.miembros.clone();
    let tags = vista.tags.clone();

    v_flex()
        .size_full()
        .p_6()
        .gap_4()
        .child(
            h_flex()
                .gap_2()
                .justify_between()
                .child(
                    h_flex()
                        .gap_2()
                        .min_w_0()
                        .flex_1()
                        .child(
                            Button::new("volver-equipos")
                                .ghost()
                                .small()
                                .icon(IconName::ArrowLeft)
                                .label("Equipos")
                                .on_click(cx.listener(|this, _, _, cx| {
                                    this.equipo_activo = None;
                                    cx.notify();
                                })),
                        )
                        .child(
                            div()
                                .text_lg()
                                .font_semibold()
                                .truncate()
                                .child(equipo.nombre.clone()),
                        ),
                )
                .child(
                    h_flex()
                        .gap_1p5()
                        .when(puede_delegados, |row| {
                            row.child(
                                Button::new("delegados-equipo")
                                    .outline()
                                    .small()
                                    .label("Delegados")
                                    .on_click(cx.listener(move |_, _, w, cx| {
                                        let weak = cx.entity().downgrade();
                                        abrir_dialogo_delegados(
                                            org_id,
                                            &eq_del,
                                            &miembros_del,
                                            weak,
                                            w,
                                            cx,
                                        );
                                    })),
                            )
                        })
                        .when(puede_editar, |row| {
                            row.child(
                                Button::new("editar-equipo-det")
                                    .outline()
                                    .small()
                                    .icon(IconName::Pencil)
                                    .label("Editar")
                                    .on_click(cx.listener(move |_, _, w, cx| {
                                        let weak = cx.entity().downgrade();
                                        abrir_dialogo_equipo(
                                            org_id,
                                            Some(eq_clone.clone()),
                                            miembros.clone(),
                                            tags.clone(),
                                            weak,
                                            w,
                                            cx,
                                        );
                                    })),
                            )
                        })
                        .when(puede_eliminar, |row| {
                            let nombre = equipo.nombre.clone();
                            row.child(
                                Button::new("eliminar-equipo-det")
                                    .ghost()
                                    .small()
                                    .icon(IconName::Delete)
                                    .tooltip("Eliminar equipo")
                                    .on_click(cx.listener(move |this, _, w, cx| {
                                        this.confirmar_eliminar_equipo(org_id, eid, &nombre, w, cx);
                                    })),
                            )
                        }),
                ),
        )
        .when(!equipo.descripcion.trim().is_empty(), |d| {
            d.child(
                div()
                    .text_sm()
                    .text_color(cx.theme().foreground)
                    .child(equipo.descripcion.trim().to_string()),
            )
        })
        .when(!equipo.miembros.is_empty(), |d| {
            d.child(
                h_flex()
                    .flex_wrap()
                    .gap_1p5()
                    .children(equipo.miembros.iter().map(|me| {
                        let nombre = vista
                            .miembros
                            .iter()
                            .find(|m| m.usuario_id == me.usuario_id)
                            .map(|m| m.nombre.clone())
                            .unwrap_or_else(|| format!("Usuario #{}", me.usuario_id));
                        let es_lider = equipo.lider_id == Some(me.usuario_id);
                        let es_delegado =
                            !es_lider && equipo.lider_id.is_some() && me.puede_crear_tareas;
                        let texto = if es_lider {
                            format!("{nombre} · Líder")
                        } else if es_delegado {
                            format!("{nombre} · Delegado")
                        } else {
                            nombre
                        };
                        h_flex()
                            .gap_1()
                            .px_2()
                            .py_1()
                            .rounded(cx.theme().radius)
                            .border_1()
                            .border_color(cx.theme().border)
                            .text_xs()
                            .when(es_lider, |chip| {
                                chip.child(
                                    Icon::new(IconName::Star)
                                        .xsmall()
                                        .text_color(cx.theme().primary),
                                )
                            })
                            .child(texto)
                    })),
            )
        })
        .child(
            h_flex()
                .justify_between()
                .child(div().text_sm().font_medium().child("Tareas del equipo"))
                .when(puede_crear_tareas, |row| {
                    row.child(
                        Button::new("nueva-tarea-equipo")
                            .small()
                            .icon(IconName::Plus)
                            .label("Nueva tarea")
                            .on_click(cx.listener(move |_, _, w, cx| {
                                let weak = cx.entity().downgrade();
                                crate::editor_tarea::abrir(
                                    None,
                                    Ambito {
                                        organizacion_id: Some(org_id),
                                        proyecto_id: None,
                                        equipo_id: Some(eid),
                                    },
                                    EstadoTarea::Pendiente,
                                    move |_, w, cx| {
                                        weak.update(cx, |v, cx| v.cargar_tareas_equipo(eid, w, cx))
                                            .ok();
                                    },
                                    w,
                                    cx,
                                );
                            })),
                    )
                }),
        )
        .child(
            v_flex()
                .id("tareas-equipo-org")
                .flex_1()
                .min_h_0()
                .overflow_y_scroll()
                .gap_1()
                .map(|d| {
                    match (
                        &vista.error_tareas_equipo,
                        vista.cargando_tareas_equipo,
                        vista.tareas_equipo.is_empty(),
                    ) {
                        (Some(e), _, _) => d.child(Alert::error("err-tareas-eq", e.clone())),
                        (None, true, true) => {
                            d.child(div().py_6().flex().justify_center().child(Spinner::new()))
                        }
                        (None, false, true) => d.child(
                            div()
                                .py_6()
                                .text_sm()
                                .text_color(cx.theme().muted_foreground)
                                .child("Este equipo aún no tiene tareas."),
                        ),
                        _ => d.children(vista.tareas_equipo.iter().map(|t| {
                            let tid = t.id;
                            let completada = t.estado == EstadoTarea::Completada;
                            let tarea_clone = t.clone();
                            h_flex()
                                .id(("tarea-eq", tid as u64))
                                .px_3()
                                .py_2()
                                .gap_2()
                                .rounded(cx.theme().radius)
                                .border_1()
                                .border_color(cx.theme().border)
                                .hover(|d| d.bg(cx.theme().accent.opacity(0.4)))
                                .on_click(cx.listener(move |_, _, w, cx| {
                                    let weak = cx.entity().downgrade();
                                    crate::editor_tarea::abrir(
                                        Some(tarea_clone.clone()),
                                        Ambito {
                                            organizacion_id: Some(org_id),
                                            proyecto_id: None,
                                            equipo_id: Some(eid),
                                        },
                                        tarea_clone.estado,
                                        move |_, w, cx| {
                                            weak.update(cx, |v, cx| {
                                                v.cargar_tareas_equipo(eid, w, cx)
                                            })
                                            .ok();
                                        },
                                        w,
                                        cx,
                                    );
                                }))
                                .child(
                                    Checkbox::new(("chk-tarea-eq", tid as u64))
                                        .checked(completada)
                                        .on_click(cx.listener(
                                            move |this, marcada: &bool, w, cx| {
                                                let nuevo = if *marcada {
                                                    EstadoTarea::Completada
                                                } else {
                                                    EstadoTarea::Pendiente
                                                };
                                                this.cambiar_estado_tarea(
                                                    tid,
                                                    nuevo,
                                                    None,
                                                    Some(eid),
                                                    w,
                                                    cx,
                                                );
                                            },
                                        )),
                                )
                                .child(
                                    div()
                                        .flex_1()
                                        .min_w_0()
                                        .truncate()
                                        .text_sm()
                                        .when(completada, |s| {
                                            s.line_through().text_color(cx.theme().muted_foreground)
                                        })
                                        .child(t.titulo.clone()),
                                )
                                .child(
                                    div()
                                        .text_xs()
                                        .text_color(cx.theme().muted_foreground)
                                        .child(t.estado.etiqueta()),
                                )
                        })),
                    }
                }),
        )
        .into_any_element()
}
