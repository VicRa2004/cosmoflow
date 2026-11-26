//! Tareas: lista filtrada por estado (maestro) y detalle de la seleccionada.

use gpui_kit::assets::IconName;
use gpui_kit::component::*;
use gpui_kit::component::{
    ActiveTheme,
    alert::Alert,
    button::{Button, ButtonVariants as _},
    checkbox::Checkbox,
    input::{Input, InputEvent, InputState},
    notification::Notification,
    spinner::Spinner,
    tab::TabBar,
    text::TextView,
};
use gpui_kit::prelude::FluentBuilder as _;
use gpui_kit::*;
use serde_json::json;

use crate::editor_tarea::{self, Ambito, color_hex};
use crate::modelos::{EstadoTarea, Pagina, Prioridad, Tag, Tarea};

/// `None` = todas (como móvil al no elegir estado).
const FILTROS: [Option<EstadoTarea>; 5] = [
    None,
    Some(EstadoTarea::Pendiente),
    Some(EstadoTarea::EnProgreso),
    Some(EstadoTarea::Completada),
    Some(EstadoTarea::Cancelada),
];

pub struct TareasView {
    filtro: Option<EstadoTarea>,
    solo_asignadas: bool,
    /// Para mostrar el nombre de los tags en el detalle.
    tags: Vec<Tag>,
    busqueda: Entity<InputState>,
    tareas: Vec<Tarea>,
    total: i64,
    seleccion: Option<i64>,
    cargando: bool,
    error: Option<SharedString>,
    /// Descarta respuestas de una carga anterior si el filtro cambió entretanto.
    revision: u64,
    _suscripciones: Vec<Subscription>,
}

impl TareasView {
    pub fn new(window: &mut Window, cx: &mut Context<Self>) -> Self {
        let busqueda = cx.new(|cx| InputState::new(window, cx).placeholder("Buscar tareas…"));
        let sub = cx.subscribe_in(&busqueda, window, |this, _, e, window, cx| {
            if matches!(e, InputEvent::PressEnter { .. }) {
                this.cargar(window, cx);
            }
        });
        let mut vista = Self {
            filtro: Some(EstadoTarea::Pendiente),
            solo_asignadas: false,
            tags: vec![],
            busqueda,
            tareas: vec![],
            total: 0,
            seleccion: None,
            cargando: false,
            error: None,
            revision: 0,
            _suscripciones: vec![sub],
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
        let busqueda = self.busqueda.read(cx).value().trim().to_string();
        // shortcut: solo la primera página de 100; paginar si alguien tiene más tareas por estado.
        let mut ruta = "/tareas?limite=100".to_string();
        if let Some(estado) = self.filtro {
            ruta.push_str(&format!("&estado={}", estado.api()));
        }
        if self.solo_asignadas {
            ruta.push_str("&asignadas=true");
        }
        if !busqueda.is_empty() {
            ruta.push_str(&format!("&busqueda={}", crate::api::codificar(&busqueda)));
        }
        cx.spawn_in(window, async move |this, cx| {
            let (r, tags) = cx
                .background_spawn(async move {
                    let tags = api.get::<Pagina<Tag>>("/tags?limite=100").map(|p| p.datos);
                    (api.get::<Pagina<Tarea>>(&ruta), tags)
                })
                .await;
            this.update(cx, |this, cx| {
                if this.revision != revision {
                    return;
                }
                this.cargando = false;
                if let Ok(tags) = tags {
                    this.tags = tags;
                }
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

    fn filtrar(
        &mut self,
        filtro: Option<EstadoTarea>,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        self.filtro = filtro;
        self.seleccion = None;
        self.cargar(window, cx);
    }

    /// PUT parcial de la tarea; sustituye la copia local con la respuesta del servidor.
    fn actualizar(
        &mut self,
        id: i64,
        cambios: serde_json::Value,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        let api = crate::api(cx);
        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(
                    async move { api.put::<Tarea>(&format!("/tareas/{id}"), cambios) },
                )
                .await;
            this.update_in(cx, |this, window, cx| {
                match r {
                    Ok(t) => {
                        if let Some(local) = this.tareas.iter_mut().find(|x| x.id == t.id) {
                            *local = t;
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

    fn cambiar_estado(
        &mut self,
        id: i64,
        estado: EstadoTarea,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        self.actualizar(id, json!({ "estado": estado.api() }), window, cx);
    }

    fn alternar_subtarea(
        &mut self,
        id: i64,
        indice: usize,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        let Some(t) = self.tareas.iter().find(|t| t.id == id) else {
            return;
        };
        // El backend reemplaza la lista entera de subtareas.
        let subtareas: Vec<_> = t
            .subtareas
            .iter()
            .enumerate()
            .map(
                |(i, s)| json!({ "titulo": s.titulo, "completada": s.completada != (i == indice) }),
            )
            .collect();
        self.actualizar(id, json!({ "subtareas": subtareas }), window, cx);
    }

    fn eliminar(&mut self, id: i64, window: &mut Window, cx: &mut Context<Self>) {
        let api = crate::api(cx);
        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(async move { api.delete(&format!("/tareas/{id}")) })
                .await;
            this.update_in(cx, |this, window, cx| {
                match r {
                    Ok(()) => {
                        this.tareas.retain(|t| t.id != id);
                        this.seleccion = this.tareas.first().map(|t| t.id);
                        window.push_notification(
                            Notification::success("Tarea enviada a la papelera."),
                            cx,
                        );
                    }
                    Err(e) => window.push_notification(Notification::error(e.mensaje), cx),
                }
                cx.notify();
            })
            .ok();
        })
        .detach();
    }

    fn confirmar_eliminar(&mut self, id: i64, window: &mut Window, cx: &mut Context<Self>) {
        let vista = cx.entity().downgrade();
        window.open_alert_dialog(cx, move |dialog, _, _| {
            let vista = vista.clone();
            dialog
                .title("¿Eliminar la tarea?")
                .child("Irá a la papelera; puedes restaurarla desde la web.")
                .button_props(
                    gpui_kit::component::dialog::DialogButtonProps::default()
                        .ok_text("Eliminar")
                        .ok_variant(gpui_kit::component::button::ButtonVariant::Danger)
                        .show_cancel(true)
                        .cancel_text("Cancelar"),
                )
                .on_ok(move |_, window, cx| {
                    vista.update(cx, |v, cx| v.eliminar(id, window, cx)).ok();
                    true
                })
        });
    }

    /// Editor completo (panel lateral); la tarea creada queda seleccionada.
    pub fn abrir_nueva(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        let estado = self.filtro.unwrap_or(EstadoTarea::Pendiente);
        let vista = cx.entity().downgrade();
        editor_tarea::abrir(
            None,
            Ambito::default(),
            estado,
            move |t, window, cx| {
                vista
                    .update(cx, |v, cx| {
                        v.seleccion = Some(t.id);
                        v.cargar(window, cx);
                    })
                    .ok();
            },
            window,
            cx,
        );
    }

    fn abrir_editar(&mut self, id: i64, window: &mut Window, cx: &mut Context<Self>) {
        let Some(tarea) = self.tareas.iter().find(|t| t.id == id).cloned() else {
            return;
        };
        let vista = cx.entity().downgrade();
        editor_tarea::abrir(
            Some(tarea),
            Ambito::default(),
            EstadoTarea::Pendiente,
            move |t, _, cx| {
                vista
                    .update(cx, |v, cx| {
                        if let Some(local) = v.tareas.iter_mut().find(|x| x.id == t.id) {
                            *local = t;
                        }
                        cx.notify();
                    })
                    .ok();
            },
            window,
            cx,
        );
    }

    /// Como móvil: pide un nombre y guarda título, contenido, prioridad, color y subtareas.
    fn guardar_como_plantilla(&mut self, id: i64, window: &mut Window, cx: &mut Context<Self>) {
        let Some(t) = self.tareas.iter().find(|t| t.id == id).cloned() else {
            return;
        };
        let nombre = cx.new(|cx| {
            InputState::new(window, cx)
                .placeholder("Nombre de la plantilla")
                .default_value(t.titulo.clone())
        });
        nombre.read(cx).focus_handle(cx).focus(window, cx);
        window.open_dialog(cx, move |dialog, _, _| {
            let nombre = nombre.clone();
            let t = t.clone();
            dialog
                .title("Guardar como plantilla")
                .w(px(440.))
                .child(Input::new(&nombre))
                .button_props(
                    gpui_kit::component::dialog::DialogButtonProps::default()
                        .ok_text("Guardar")
                        .show_cancel(true)
                        .cancel_text("Cancelar"),
                )
                .on_ok(move |_, window, cx| {
                    let texto = nombre.read(cx).value().trim().to_string();
                    if texto.is_empty() {
                        return false;
                    }
                    let cuerpo = json!({
                        "nombre": texto,
                        "titulo": t.titulo,
                        "contenido": t.contenido,
                        "prioridad": t.prioridad.api(),
                        "color": t.color,
                        "subtareas": t.subtareas.iter().map(|s| s.titulo.clone()).collect::<Vec<_>>(),
                    });
                    let api = crate::api(cx);
                    window
                        .spawn(cx, async move |cx| {
                            let r = cx
                                .background_spawn(async move {
                                    api.post::<serde_json::Value>("/plantillas", cuerpo)
                                })
                                .await;
                            cx.update(|window, cx| match r {
                                Ok(_) => window.push_notification(
                                    Notification::success("Plantilla guardada."),
                                    cx,
                                ),
                                Err(e) => {
                                    window.push_notification(Notification::error(e.mensaje), cx)
                                }
                            })
                            .ok();
                        })
                        .detach();
                    true
                })
        });
    }

    fn fila(&self, t: &Tarea, cx: &mut Context<Self>) -> impl IntoElement {
        let id = t.id;
        let seleccionada = self.seleccion == Some(id);
        let completada = t.estado == EstadoTarea::Completada;
        h_flex()
            .id(("tarea", id as u64))
            .gap_2()
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
                Checkbox::new(("completar", id as u64))
                    .checked(completada)
                    .on_click(cx.listener(move |this, marcada: &bool, window, cx| {
                        let estado = if *marcada {
                            EstadoTarea::Completada
                        } else {
                            EstadoTarea::Pendiente
                        };
                        this.cambiar_estado(id, estado, window, cx);
                    })),
            )
            .child(
                div()
                    .flex_1()
                    .min_w_0()
                    .truncate()
                    .text_sm()
                    .when(completada, |d| {
                        d.line_through().text_color(cx.theme().muted_foreground)
                    })
                    .child(t.titulo.clone()),
            )
            .when(t.prioridad == Prioridad::Alta, |d| {
                d.child(div().text_xs().text_color(cx.theme().danger).child("Alta"))
            })
            .children(t.fecha_vencimiento.clone().map(|f| {
                div()
                    .text_xs()
                    .text_color(cx.theme().muted_foreground)
                    .child(f)
            }))
    }

    /// Prioridad, fechas, color y tags de la tarea.
    fn metadatos(&self, t: &Tarea, cx: &mut Context<Self>) -> impl IntoElement {
        let tenue = cx.theme().muted_foreground;
        let dato = move |etiqueta: &'static str, valor: String| {
            h_flex()
                .gap_1()
                .text_sm()
                .child(div().text_color(tenue).child(etiqueta))
                .child(valor)
        };
        let tags = t
            .tag_ids
            .iter()
            .filter_map(|id| self.tags.iter().find(|x| x.id == *id))
            .map(|tag| {
                gpui_kit::component::tag::Tag::new()
                    .small()
                    .child(tag.nombre.clone())
                    .into_any_element()
            })
            .collect::<Vec<_>>();
        h_flex()
            .flex_wrap()
            .gap_x_4()
            .gap_y_2()
            .child(dato("Prioridad", t.prioridad.etiqueta().into()))
            .children(t.fecha_inicio.clone().map(|f| dato("Inicio", f)))
            .children(t.fecha_vencimiento.clone().map(|f| dato("Vence", f)))
            .children(
                t.color
                    .as_deref()
                    .map(|c| div().size_3().rounded_full().bg(color_hex(c))),
            )
            .children(tags)
    }

    fn detalle(&self, t: &Tarea, cx: &mut Context<Self>) -> impl IntoElement {
        let id = t.id;
        let hechas = t.subtareas.iter().filter(|s| s.completada).count();
        v_flex()
            .id("detalle-tarea")
            .size_full()
            .overflow_y_scroll()
            .p_6()
            .gap_4()
            .child(
                h_flex()
                    .gap_2()
                    .items_start()
                    .child(
                        div()
                            .flex_1()
                            .min_w_0()
                            .text_xl()
                            .font_semibold()
                            .child(t.titulo.clone()),
                    )
                    .child(
                        Button::new("editar-tarea")
                            .icon(IconName::Pencil)
                            .ghost()
                            .small()
                            .tooltip("Editar")
                            .on_click(cx.listener(move |this, _, window, cx| {
                                this.abrir_editar(id, window, cx)
                            })),
                    )
                    .child(
                        Button::new("plantilla-tarea")
                            .icon(IconName::LayoutTemplate)
                            .ghost()
                            .small()
                            .tooltip("Guardar como plantilla")
                            .on_click(cx.listener(move |this, _, window, cx| {
                                this.guardar_como_plantilla(id, window, cx)
                            })),
                    )
                    .child(
                        Button::new("eliminar-tarea")
                            .icon(IconName::Delete)
                            .ghost()
                            .small()
                            .tooltip("Eliminar")
                            .on_click(cx.listener(move |this, _, window, cx| {
                                this.confirmar_eliminar(id, window, cx)
                            })),
                    ),
            )
            .child(h_flex().gap_1().children(EstadoTarea::TODOS.map(|estado| {
                Button::new(("estado", estado as u64))
                    .small()
                    .label(estado.etiqueta())
                    .when(estado == t.estado, |b| b.primary())
                    .when(estado != t.estado, |b| b.outline())
                    .on_click(cx.listener(move |this, _, window, cx| {
                        this.cambiar_estado(id, estado, window, cx)
                    }))
            })))
            .child(self.metadatos(t, cx))
            .when(t.bloqueada, |d| {
                d.child(Alert::warning(
                    "bloqueada",
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
                                .child(format!("Subtareas · {hechas}/{}", t.subtareas.len())),
                        )
                        .children(t.subtareas.iter().enumerate().map(|(i, s)| {
                            Checkbox::new(("subtarea", s.id as u64))
                                .label(s.titulo.clone())
                                .checked(s.completada)
                                .on_click(cx.listener(move |this, _, window, cx| {
                                    this.alternar_subtarea(id, i, window, cx)
                                }))
                        })),
                )
            })
            .when(!t.contenido.trim().is_empty(), |d| {
                d.child(
                    TextView::markdown(("contenido-tarea", id as u64), t.contenido.clone())
                        .selectable(true),
                )
            })
    }
}

impl Render for TareasView {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let seleccionada = self
            .seleccion
            .and_then(|id| self.tareas.iter().find(|t| t.id == id))
            .cloned();
        let indice = FILTROS.iter().position(|f| *f == self.filtro).unwrap_or(0);
        let filas: Vec<_> = self
            .tareas
            .iter()
            .map(|t| self.fila(t, cx).into_any_element())
            .collect();

        let lista = v_flex()
            .size_full()
            .child(
                v_flex()
                    .p_3()
                    .gap_3()
                    .child(
                        h_flex()
                            .gap_2()
                            .child(Input::new(&self.busqueda).small().cleanable(true).flex_1())
                            .child(
                                Button::new("solo-asignadas")
                                    .icon(IconName::UserCheck)
                                    .small()
                                    .when(self.solo_asignadas, |b| b.primary())
                                    .when(!self.solo_asignadas, |b| b.outline())
                                    .tooltip("Asignadas a mí")
                                    .on_click(cx.listener(|this, _, window, cx| {
                                        this.solo_asignadas = !this.solo_asignadas;
                                        this.cargar(window, cx);
                                    })),
                            )
                            .child(
                                Button::new("nueva-tarea")
                                    .icon(IconName::Plus)
                                    .small()
                                    .tooltip("Nueva tarea (Ctrl+N)")
                                    .on_click(cx.listener(|this, _, window, cx| {
                                        this.abrir_nueva(window, cx)
                                    })),
                            ),
                    )
                    .child(
                        TabBar::new("filtro-tareas")
                            .segmented()
                            .small()
                            .selected_index(indice)
                            .children(FILTROS.map(|f| f.map_or("Todas", |e| e.etiqueta())))
                            .on_click(cx.listener(|this, i: &usize, window, cx| {
                                this.filtrar(FILTROS[*i], window, cx)
                            })),
                    ),
            )
            .child(
                v_flex()
                    .id("lista-tareas")
                    .flex_1()
                    .min_h_0()
                    .overflow_y_scroll()
                    .px_2()
                    .pb_2()
                    .gap_px()
                    .map(|d| match (&self.error, self.cargando, filas.is_empty()) {
                        (Some(e), _, _) => {
                            d.child(div().p_2().child(Alert::error("error-tareas", e.clone())))
                        }
                        (None, true, true) => {
                            d.child(div().p_4().flex().justify_center().child(Spinner::new()))
                        }
                        (None, false, true) => d.child(
                            div()
                                .p_4()
                                .text_sm()
                                .text_color(cx.theme().muted_foreground)
                                .child("No hay tareas aquí."),
                        ),
                        _ => d.children(filas),
                    }),
            )
            .child(
                div()
                    .px_3()
                    .py_1p5()
                    .border_t_1()
                    .border_color(cx.theme().border)
                    .text_xs()
                    .text_color(cx.theme().muted_foreground)
                    .child(format!("{} tareas", self.total)),
            );

        h_resizable("tareas-paneles")
            .on_resize(crate::preferencias::guardar_ancho_panel(
                "tareas-paneles",
                0,
            ))
            .child(
                resizable_panel()
                    .size(crate::preferencias::ancho_panel("tareas-paneles", 440., cx))
                    .size_range(px(300.)..px(760.))
                    .child(lista),
            )
            .child(resizable_panel().child(div().size_full().map(|d| {
                match seleccionada {
                    Some(t) => d.child(self.detalle(&t, cx)),
                    None => d
                        .flex()
                        .items_center()
                        .justify_center()
                        .text_color(cx.theme().muted_foreground)
                        .child(
                            v_flex()
                                .items_center()
                                .gap_2()
                                .child("Selecciona una tarea")
                                .child(
                                    Button::new("vacio-nueva")
                                        .label("Nueva tarea")
                                        .disabled(false)
                                        .on_click(cx.listener(|this, _, window, cx| {
                                            this.abrir_nueva(window, cx)
                                        })),
                                ),
                        ),
                }
            })))
    }
}
