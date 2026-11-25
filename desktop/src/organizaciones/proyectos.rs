//! Pestaña de proyectos y detalle de proyecto dentro de una organización.

use gpui_kit::assets::IconName;
use gpui_kit::component::ActiveTheme;
use gpui_kit::component::alert::Alert;
use gpui_kit::component::button::{Button, ButtonVariants as _};
use gpui_kit::component::checkbox::Checkbox;
use gpui_kit::component::progress::Progress;
use gpui_kit::component::spinner::Spinner;
use gpui_kit::component::*;
use gpui_kit::prelude::FluentBuilder as _;
use gpui_kit::*;

use crate::editor_tarea::Ambito;
use crate::modelos::{EstadoProyecto, EstadoTarea, Organizacion, Proyecto};

use super::OrganizacionesView;
use super::datos::parsear_color_hex;
use super::formularios::abrir_dialogo_proyecto;

pub fn render_proyectos(
    vista: &OrganizacionesView,
    org: &Organizacion,
    cx: &mut Context<OrganizacionesView>,
) -> AnyElement {
    if let Some(pid) = vista.proyecto_activo
        && let Some(proyecto) = vista.proyectos.iter().find(|p| p.id == pid)
    {
        return render_detalle_proyecto(vista, org, proyecto, cx);
    }

    let filtrados: Vec<&Proyecto> = match vista.filtro_estado_proyecto {
        None => vista.proyectos.iter().collect(),
        Some(est) => vista.proyectos.iter().filter(|p| p.estado == est).collect(),
    };
    let mut filas = Vec::with_capacity(filtrados.len());
    for p in filtrados {
        filas.push(fila_proyecto(p, cx).into_any_element());
    }
    let puede_crear = org.puede("proyectos:crear");

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
                        .gap_1p5()
                        .child(
                            Button::new("proy-filtro-todos")
                                .small()
                                .label("Todos")
                                .when(vista.filtro_estado_proyecto.is_none(), |b| b.primary())
                                .when(vista.filtro_estado_proyecto.is_some(), |b| b.outline())
                                .on_click(cx.listener(|this, _, _, cx| {
                                    this.filtro_estado_proyecto = None;
                                    cx.notify();
                                })),
                        )
                        .children(EstadoProyecto::TODOS.map(|est| {
                            let sel = vista.filtro_estado_proyecto == Some(est);
                            Button::new(("proy-filtro", est as u64))
                                .small()
                                .label(est.etiqueta())
                                .when(sel, |b| b.primary())
                                .when(!sel, |b| b.outline())
                                .on_click(cx.listener(move |this, _, _, cx| {
                                    this.filtro_estado_proyecto = Some(est);
                                    cx.notify();
                                }))
                        })),
                )
                .when(puede_crear, |d| {
                    let org_id = org.id;
                    let equipos = vista.equipos.clone();
                    let miembros = vista.miembros.clone();
                    d.child(
                        Button::new("nuevo-proyecto")
                            .small()
                            .icon(IconName::Plus)
                            .label("Nuevo proyecto")
                            .on_click(cx.listener(move |_, _, w, cx| {
                                let weak = cx.entity().downgrade();
                                abrir_dialogo_proyecto(
                                    org_id,
                                    None,
                                    equipos.clone(),
                                    miembros.clone(),
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
                .id("lista-proyectos-org")
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
                                .child("No hay proyectos que coincidan con el filtro."),
                        )
                    } else {
                        d.children(filas)
                    }
                }),
        )
        .into_any_element()
}

fn fila_proyecto(p: &Proyecto, cx: &mut Context<OrganizacionesView>) -> impl IntoElement {
    let pid = p.id;
    let color = parsear_color_hex(p.color.as_deref())
        .map(Into::into)
        .unwrap_or(cx.theme().primary);
    let prog = p.progreso;
    let pct = if prog.tareas > 0 {
        Some((prog.completadas as f32 / prog.tareas as f32) * 100.0)
    } else {
        None
    };

    v_flex()
        .id(("proyecto-org", pid as u64))
        .p_3()
        .gap_2()
        .rounded(cx.theme().radius)
        .border_1()
        .border_color(cx.theme().border)
        .hover(|d| d.bg(cx.theme().accent.opacity(0.4)))
        .on_click(cx.listener(move |this, _, w, cx| {
            this.abrir_proyecto(pid, w, cx);
        }))
        .child(
            h_flex()
                .gap_2p5()
                .child(Icon::new(IconName::Folder).text_color(color))
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
                                .child(p.nombre.clone()),
                        )
                        .child(
                            div()
                                .text_xs()
                                .text_color(cx.theme().muted_foreground)
                                .truncate()
                                .child(resumen_proyecto(p)),
                        ),
                )
                .child(
                    Icon::new(IconName::ChevronRight)
                        .small()
                        .text_color(cx.theme().muted_foreground),
                ),
        )
        .when_some(pct, |d, valor| {
            d.child(
                Progress::new(("prog-proy", pid as u64))
                    .xsmall()
                    .value(valor)
                    .color(color),
            )
        })
}

fn resumen_proyecto(p: &Proyecto) -> String {
    let mut partes = vec![
        p.estado.etiqueta().to_string(),
        format!("{}/{} tareas", p.progreso.completadas, p.progreso.tareas),
    ];
    if let Some(f) = &p.fecha_fin
        && !f.is_empty()
    {
        partes.push(format!("Entrega {f}"));
    }
    if !p.descripcion.trim().is_empty() {
        partes.push(p.descripcion.trim().to_string());
    }
    partes.join(" · ")
}

fn render_detalle_proyecto(
    vista: &OrganizacionesView,
    org: &Organizacion,
    proyecto: &Proyecto,
    cx: &mut Context<OrganizacionesView>,
) -> AnyElement {
    let pid = proyecto.id;
    let org_id = org.id;
    let puede_editar = org.puede("proyectos:editar");
    let puede_eliminar = org.puede("proyectos:eliminar");
    let proy_clone = proyecto.clone();
    let equipos = vista.equipos.clone();
    let miembros = vista.miembros.clone();

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
                            Button::new("volver-proyectos")
                                .ghost()
                                .small()
                                .icon(IconName::ArrowLeft)
                                .label("Proyectos")
                                .on_click(cx.listener(|this, _, _, cx| {
                                    this.proyecto_activo = None;
                                    cx.notify();
                                })),
                        )
                        .child(
                            div()
                                .text_lg()
                                .font_semibold()
                                .truncate()
                                .child(proyecto.nombre.clone()),
                        ),
                )
                .child(
                    h_flex()
                        .gap_1p5()
                        .when(puede_editar, |row| {
                            row.child(
                                Button::new("editar-proyecto-det")
                                    .outline()
                                    .small()
                                    .icon(IconName::Pencil)
                                    .label("Editar")
                                    .on_click(cx.listener(move |_, _, w, cx| {
                                        let weak = cx.entity().downgrade();
                                        abrir_dialogo_proyecto(
                                            org_id,
                                            Some(proy_clone.clone()),
                                            equipos.clone(),
                                            miembros.clone(),
                                            weak,
                                            w,
                                            cx,
                                        );
                                    })),
                            )
                        })
                        .when(puede_eliminar, |row| {
                            let nombre = proyecto.nombre.clone();
                            row.child(
                                Button::new("eliminar-proyecto-det")
                                    .ghost()
                                    .small()
                                    .icon(IconName::Delete)
                                    .tooltip("Eliminar proyecto")
                                    .on_click(cx.listener(move |this, _, w, cx| {
                                        this.confirmar_eliminar_proyecto(
                                            org_id, pid, &nombre, w, cx,
                                        );
                                    })),
                            )
                        }),
                ),
        )
        .child(
            v_flex()
                .gap_1()
                .child(
                    div()
                        .text_xs()
                        .text_color(cx.theme().muted_foreground)
                        .child(resumen_proyecto(proyecto)),
                )
                .when(!proyecto.descripcion.trim().is_empty(), |d| {
                    d.child(
                        div()
                            .text_sm()
                            .text_color(cx.theme().foreground)
                            .child(proyecto.descripcion.trim().to_string()),
                    )
                }),
        )
        .child(
            h_flex()
                .justify_between()
                .child(div().text_sm().font_medium().child("Tareas del proyecto"))
                .child(
                    Button::new("nueva-tarea-proyecto")
                        .small()
                        .icon(IconName::Plus)
                        .label("Nueva tarea")
                        .on_click(cx.listener(move |_, _, w, cx| {
                            let weak = cx.entity().downgrade();
                            crate::editor_tarea::abrir(
                                None,
                                Ambito {
                                    organizacion_id: Some(org_id),
                                    proyecto_id: Some(pid),
                                    equipo_id: None,
                                },
                                EstadoTarea::Pendiente,
                                move |_, w, cx| {
                                    weak.update(cx, |v, cx| v.cargar_tareas_proyecto(pid, w, cx))
                                        .ok();
                                },
                                w,
                                cx,
                            );
                        })),
                ),
        )
        .child(
            v_flex()
                .id("tareas-proyecto-org")
                .flex_1()
                .min_h_0()
                .overflow_y_scroll()
                .gap_1()
                .map(|d| {
                    match (
                        &vista.error_tareas_proyecto,
                        vista.cargando_tareas_proyecto,
                        vista.tareas_proyecto.is_empty(),
                    ) {
                        (Some(e), _, _) => d.child(Alert::error("err-tareas-proy", e.clone())),
                        (None, true, true) => {
                            d.child(div().py_6().flex().justify_center().child(Spinner::new()))
                        }
                        (None, false, true) => d.child(
                            div()
                                .py_6()
                                .text_sm()
                                .text_color(cx.theme().muted_foreground)
                                .child("Este proyecto aún no tiene tareas."),
                        ),
                        _ => d.children(vista.tareas_proyecto.iter().map(|t| {
                            let tid = t.id;
                            let completada = t.estado == EstadoTarea::Completada;
                            let tarea_clone = t.clone();
                            h_flex()
                                .id(("tarea-proy", tid as u64))
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
                                            proyecto_id: Some(pid),
                                            equipo_id: None,
                                        },
                                        tarea_clone.estado,
                                        move |_, w, cx| {
                                            weak.update(cx, |v, cx| {
                                                v.cargar_tareas_proyecto(pid, w, cx)
                                            })
                                            .ok();
                                        },
                                        w,
                                        cx,
                                    );
                                }))
                                .child(
                                    Checkbox::new(("chk-tarea-proy", tid as u64))
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
                                                    Some(pid),
                                                    None,
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
