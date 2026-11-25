//! Plantillas de tareas: maestro-detalle con creación, edición completa y eliminación.

use gpui_kit::assets::IconName;
use gpui_kit::component::*;
use gpui_kit::component::{
    ActiveTheme,
    alert::Alert,
    button::{Button, ButtonVariants as _},
    dialog::DialogButtonProps,
    input::{Input, InputEvent, InputState, Textarea, TextareaState},
    notification::Notification,
    spinner::Spinner,
    tab::TabBar,
    tag::Tag,
    text::TextView,
};
use gpui_kit::prelude::FluentBuilder as _;
use gpui_kit::*;
use serde_json::json;

use crate::modelos::{PlantillaTarea, Prioridad};

const COLORES_PLANTILLA: [&str; 8] = [
    "#6366F1", "#4F46E5", "#E11D48", "#059669", "#D97706", "#0284C7", "#7C3AED", "#0D9488",
];

/// Carga las plantillas personales (`organizacion_id = None`) o de una organización (`Some(id)`).
///
/// Bloqueante: llamar siempre dentro de `cx.background_spawn`.
pub fn cargar_plantillas(
    api: &crate::api::Api,
    organizacion_id: Option<i64>,
) -> crate::api::Resultado<Vec<PlantillaTarea>> {
    api.get::<Vec<PlantillaTarea>>(&ruta_plantillas(organizacion_id))
}

fn ruta_plantillas(organizacion_id: Option<i64>) -> String {
    match organizacion_id {
        Some(id) => format!("/organizaciones/{id}/plantillas"),
        None => "/plantillas".to_string(),
    }
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum ModoEditor {
    Lectura,
    Creando,
    Editando(i64),
}

pub struct PlantillasView {
    busqueda: Entity<InputState>,
    editor_nombre: Entity<InputState>,
    editor_titulo: Entity<InputState>,
    editor_subtarea: Entity<InputState>,
    editor_contenido: Entity<TextareaState>,
    editor_prioridad: Prioridad,
    editor_color: Option<String>,
    editor_subtareas: Vec<(u64, String)>,
    siguiente_id_subtarea: u64,
    plantillas: Vec<PlantillaTarea>,
    seleccion: Option<i64>,
    modo: ModoEditor,
    cargando: bool,
    guardando: bool,
    error: Option<SharedString>,
    /// Descarta respuestas viejas si se lanza una recarga más reciente.
    revision: u64,
    _suscripciones: Vec<Subscription>,
}

impl PlantillasView {
    pub fn new(window: &mut Window, cx: &mut Context<Self>) -> Self {
        let busqueda = cx.new(|cx| InputState::new(window, cx).placeholder("Filtrar plantillas…"));
        let editor_nombre =
            cx.new(|cx| InputState::new(window, cx).placeholder("Ej. Release, Revisión semanal"));
        let editor_titulo =
            cx.new(|cx| InputState::new(window, cx).placeholder("Título de la tarea generada"));
        let editor_subtarea =
            cx.new(|cx| InputState::new(window, cx).placeholder("Añadir subtarea…"));
        let editor_contenido = cx.new(|cx| {
            TextareaState::new(window, cx)
                .soft_wrap(true)
                .placeholder("Detalles, pasos o checklist en Markdown…")
        });

        let sub_busqueda = cx.subscribe_in(&busqueda, window, |_, _, e, _, cx| {
            if matches!(e, InputEvent::Change) {
                cx.notify();
            }
        });
        let sub_subtarea = cx.subscribe_in(&editor_subtarea, window, |this, _, e, window, cx| {
            if matches!(e, InputEvent::PressEnter { .. }) {
                this.agregar_subtarea(window, cx);
            }
        });

        let mut vista = Self {
            busqueda,
            editor_nombre,
            editor_titulo,
            editor_subtarea,
            editor_contenido,
            editor_prioridad: Prioridad::Media,
            editor_color: None,
            editor_subtareas: Vec::new(),
            siguiente_id_subtarea: 1,
            plantillas: Vec::new(),
            seleccion: None,
            modo: ModoEditor::Lectura,
            cargando: false,
            guardando: false,
            error: None,
            revision: 0,
            _suscripciones: vec![sub_busqueda, sub_subtarea],
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
                .background_spawn(async move { cargar_plantillas(&api, None) })
                .await;
            this.update(cx, |this, cx| {
                if this.revision != revision {
                    return;
                }
                this.cargando = false;
                match r {
                    Ok(lista) => {
                        let seleccion_anterior = this.seleccion;
                        this.plantillas = lista;
                        if !this.plantillas.iter().any(|p| Some(p.id) == this.seleccion) {
                            this.seleccion = this.plantillas.first().map(|p| p.id);
                        }
                        if matches!(this.modo, ModoEditor::Editando(_))
                            && this.seleccion != seleccion_anterior
                        {
                            this.modo = ModoEditor::Lectura;
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

    fn seleccionar(&mut self, id: i64, cx: &mut Context<Self>) {
        if self.guardando {
            return;
        }
        if self.seleccion != Some(id) || self.modo != ModoEditor::Lectura {
            self.seleccion = Some(id);
            self.modo = ModoEditor::Lectura;
            cx.notify();
        }
    }

    fn iniciar_nueva(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        if self.guardando {
            return;
        }
        self.editor_nombre
            .update(cx, |e, cx| e.set_value("", window, cx));
        self.editor_titulo
            .update(cx, |e, cx| e.set_value("", window, cx));
        self.editor_subtarea
            .update(cx, |e, cx| e.set_value("", window, cx));
        self.editor_contenido
            .update(cx, |e, cx| e.set_value("", window, cx));
        self.editor_prioridad = Prioridad::Media;
        self.editor_color = None;
        self.editor_subtareas.clear();
        self.modo = ModoEditor::Creando;
        self.editor_nombre
            .read(cx)
            .focus_handle(cx)
            .focus(window, cx);
        cx.notify();
    }

    fn iniciar_edicion(&mut self, id: i64, window: &mut Window, cx: &mut Context<Self>) {
        if self.guardando {
            return;
        }
        let Some(p) = self.plantillas.iter().find(|p| p.id == id).cloned() else {
            return;
        };
        self.editor_nombre
            .update(cx, |e, cx| e.set_value(p.nombre, window, cx));
        self.editor_titulo
            .update(cx, |e, cx| e.set_value(p.titulo, window, cx));
        self.editor_subtarea
            .update(cx, |e, cx| e.set_value("", window, cx));
        self.editor_contenido
            .update(cx, |e, cx| e.set_value(p.contenido, window, cx));
        self.editor_prioridad = p.prioridad;
        self.editor_color = p.color;
        self.editor_subtareas.clear();
        for s in p.subtareas {
            let sid = self.siguiente_id_subtarea;
            self.siguiente_id_subtarea += 1;
            self.editor_subtareas.push((sid, s));
        }
        self.seleccion = Some(id);
        self.modo = ModoEditor::Editando(id);
        self.editor_nombre
            .read(cx)
            .focus_handle(cx)
            .focus(window, cx);
        cx.notify();
    }

    fn cancelar_edicion(&mut self, cx: &mut Context<Self>) {
        if self.guardando {
            return;
        }
        self.modo = ModoEditor::Lectura;
        cx.notify();
    }

    fn agregar_subtarea(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        let texto = self.editor_subtarea.read(cx).value().trim().to_string();
        if texto.is_empty() {
            return;
        }
        if self.editor_subtareas.len() >= 100 {
            window.push_notification(Notification::error("Máximo 100 subtareas."), cx);
            return;
        }
        let id = self.siguiente_id_subtarea;
        self.siguiente_id_subtarea += 1;
        self.editor_subtareas.push((id, texto));
        self.editor_subtarea
            .update(cx, |e, cx| e.set_value("", window, cx));
        cx.notify();
    }

    fn quitar_subtarea(&mut self, id: u64, cx: &mut Context<Self>) {
        self.editor_subtareas.retain(|(sid, _)| *sid != id);
        cx.notify();
    }

    fn guardar(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        if self.guardando {
            return;
        }
        let nombre_raw = self.editor_nombre.read(cx).value().to_string();
        let titulo_raw = self.editor_titulo.read(cx).value().to_string();
        let (nombre, titulo) = match validar_plantilla(&nombre_raw, &titulo_raw) {
            Ok(v) => v,
            Err(msg) => {
                window.push_notification(Notification::error(msg), cx);
                return;
            }
        };

        let contenido = self.editor_contenido.read(cx).value().to_string();
        let prioridad = self.editor_prioridad;
        let color = self.editor_color.clone().filter(|c| !c.trim().is_empty());
        let subtareas = normalizar_subtareas(self.editor_subtareas.iter().map(|(_, s)| s.as_str()));
        let cuerpo = json!({
            "nombre": nombre,
            "titulo": titulo,
            "contenido": contenido,
            "prioridad": prioridad.api(),
            "color": color,
            "subtareas": subtareas,
        });

        let id_edicion = match self.modo {
            ModoEditor::Editando(id) => Some(id),
            ModoEditor::Creando => None,
            ModoEditor::Lectura => return,
        };

        self.guardando = true;
        cx.notify();

        let api = crate::api(cx);
        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(async move {
                    match id_edicion {
                        Some(id) => api.put::<PlantillaTarea>(&format!("/plantillas/{id}"), cuerpo),
                        None => api.post::<PlantillaTarea>("/plantillas", cuerpo),
                    }
                })
                .await;

            this.update_in(cx, |this, window, cx| {
                this.guardando = false;
                match r {
                    Ok(guardada) => {
                        let id = guardada.id;
                        if let Some(local) = this.plantillas.iter_mut().find(|p| p.id == id) {
                            *local = guardada;
                        } else {
                            this.plantillas.push(guardada);
                        }
                        this.plantillas.sort_by(|a, b| a.nombre.cmp(&b.nombre));
                        this.seleccion = Some(id);
                        this.modo = ModoEditor::Lectura;
                        window.push_notification(
                            Notification::success(if id_edicion.is_some() {
                                "Plantilla actualizada."
                            } else {
                                "Plantilla creada."
                            }),
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

    fn confirmar_eliminar(
        &mut self,
        p: PlantillaTarea,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        let vista = cx.entity().downgrade();
        let id = p.id;
        window.open_alert_dialog(cx, move |dialog, _, _| {
            let vista = vista.clone();
            dialog
                .title(format!("¿Eliminar la plantilla «{}»?", p.nombre))
                .child("Las tareas creadas con ella no cambian. Esta acción no se puede deshacer.")
                .button_props(
                    DialogButtonProps::default()
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

    fn eliminar(&mut self, id: i64, window: &mut Window, cx: &mut Context<Self>) {
        let api = crate::api(cx);
        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(async move { api.delete(&format!("/plantillas/{id}")) })
                .await;
            this.update_in(cx, |this, window, cx| {
                match r {
                    Ok(()) => {
                        this.plantillas.retain(|p| p.id != id);
                        if this.seleccion == Some(id) {
                            this.seleccion = this.plantillas.first().map(|p| p.id);
                            this.modo = ModoEditor::Lectura;
                        }
                        window.push_notification(Notification::success("Plantilla eliminada."), cx);
                    }
                    Err(e) => window.push_notification(Notification::error(e.mensaje), cx),
                }
                cx.notify();
            })
            .ok();
        })
        .detach();
    }

    fn fila(&self, p: &PlantillaTarea, cx: &mut Context<Self>) -> impl IntoElement {
        let id = p.id;
        let seleccionada = self.seleccion == Some(id) && self.modo != ModoEditor::Creando;
        let color_hex = parsear_color_hex(p.color.as_deref());

        h_flex()
            .id(("plantilla", id as u64))
            .gap_3()
            .px_3()
            .py_2()
            .rounded(cx.theme().radius)
            .when(seleccionada, |d| d.bg(cx.theme().accent))
            .hover(|d| d.bg(cx.theme().accent.opacity(0.6)))
            .on_click(cx.listener(move |this, _, _, cx| {
                this.seleccionar(id, cx);
            }))
            .child(
                div()
                    .w_4()
                    .flex()
                    .items_center()
                    .justify_center()
                    .child(match color_hex {
                        Some(hex) => div()
                            .size_2p5()
                            .rounded_full()
                            .bg(rgb(hex))
                            .into_any_element(),
                        None => Icon::new(IconName::LayoutTemplate)
                            .small()
                            .text_color(cx.theme().muted_foreground)
                            .into_any_element(),
                    }),
            )
            .child(
                v_flex()
                    .flex_1()
                    .min_w_0()
                    .gap_0p5()
                    .child(
                        div()
                            .truncate()
                            .text_sm()
                            .font_medium()
                            .child(p.nombre.clone()),
                    )
                    .child(
                        div()
                            .truncate()
                            .text_xs()
                            .text_color(cx.theme().muted_foreground)
                            .child(subtitulo_plantilla(p)),
                    ),
            )
    }

    fn detalle_lectura(&self, p: &PlantillaTarea, cx: &mut Context<Self>) -> impl IntoElement {
        let id = p.id;
        let color_hex = parsear_color_hex(p.color.as_deref());
        let p_eliminar = p.clone();
        let tag_prioridad = match p.prioridad {
            Prioridad::Alta => Tag::danger().small().child("Prioridad alta"),
            Prioridad::Media => Tag::warning().small().child("Prioridad media"),
            Prioridad::Baja => Tag::secondary().small().child("Prioridad baja"),
        };

        v_flex()
            .id("detalle-plantilla")
            .size_full()
            .overflow_y_scroll()
            .p_6()
            .gap_5()
            .child(
                h_flex()
                    .gap_3()
                    .items_start()
                    .child(
                        h_flex()
                            .flex_1()
                            .min_w_0()
                            .gap_2p5()
                            .items_center()
                            .when_some(color_hex, |d, hex| {
                                d.child(div().size_3().rounded_full().bg(rgb(hex)))
                            })
                            .child(
                                div()
                                    .flex_1()
                                    .min_w_0()
                                    .text_xl()
                                    .font_semibold()
                                    .child(p.nombre.clone()),
                            ),
                    )
                    .child(
                        Button::new("editar-plantilla")
                            .outline()
                            .small()
                            .icon(IconName::Pencil)
                            .label("Editar")
                            .on_click(cx.listener(move |this, _, window, cx| {
                                this.iniciar_edicion(id, window, cx);
                            })),
                    )
                    .child(
                        Button::new("eliminar-plantilla")
                            .ghost()
                            .small()
                            .icon(IconName::Delete)
                            .tooltip("Eliminar")
                            .on_click(cx.listener(move |this, _, window, cx| {
                                this.confirmar_eliminar(p_eliminar.clone(), window, cx);
                            })),
                    ),
            )
            .child(
                v_flex()
                    .gap_2()
                    .p_4()
                    .rounded(cx.theme().radius)
                    .border_1()
                    .border_color(cx.theme().border)
                    .child(
                        div()
                            .text_xs()
                            .text_color(cx.theme().muted_foreground)
                            .child("Título de la tarea"),
                    )
                    .child(div().text_sm().font_medium().child(p.titulo.clone()))
                    .child(h_flex().gap_2().pt_1().child(tag_prioridad).when_some(
                        p.color.clone().filter(|c| !c.trim().is_empty()),
                        |d, hex| d.child(Tag::secondary().small().child(hex)),
                    )),
            )
            .when(!p.subtareas.is_empty(), |d| {
                d.child(
                    v_flex()
                        .gap_2()
                        .child(
                            div()
                                .text_sm()
                                .font_medium()
                                .child(format!("Subtareas · {}", p.subtareas.len())),
                        )
                        .children(p.subtareas.iter().enumerate().map(|(i, s)| {
                            h_flex()
                                .id(("subtarea-lectura", i as u64 + (id as u64) * 1000))
                                .gap_2()
                                .items_center()
                                .child(
                                    Icon::new(IconName::ListChecks)
                                        .small()
                                        .text_color(cx.theme().muted_foreground),
                                )
                                .child(div().text_sm().child(s.clone()))
                        })),
                )
            })
            .child(
                v_flex()
                    .gap_2()
                    .child(div().text_sm().font_medium().child("Contenido"))
                    .child(if p.contenido.trim().is_empty() {
                        div()
                            .text_sm()
                            .text_color(cx.theme().muted_foreground)
                            .child("Sin descripción.")
                            .into_any_element()
                    } else {
                        TextView::markdown(("contenido-plantilla", id as u64), p.contenido.clone())
                            .selectable(true)
                            .into_any_element()
                    }),
            )
    }

    fn detalle_editor(&self, cx: &mut Context<Self>) -> impl IntoElement {
        let es_creacion = self.modo == ModoEditor::Creando;
        let prioridad_ix = Prioridad::TODAS
            .iter()
            .position(|&p| p == self.editor_prioridad)
            .unwrap_or(1);
        let sin_color = self
            .editor_color
            .as_deref()
            .is_none_or(|c| c.trim().is_empty());

        let mut opciones_color: Vec<String> =
            COLORES_PLANTILLA.iter().map(|&c| c.to_string()).collect();
        if let Some(actual) = &self.editor_color
            && !actual.trim().is_empty()
            && !opciones_color
                .iter()
                .any(|c| c.eq_ignore_ascii_case(actual))
        {
            opciones_color.push(actual.clone());
        }

        v_flex()
            .size_full()
            .child(
                h_flex()
                    .px_6()
                    .py_4()
                    .gap_2()
                    .border_b_1()
                    .border_color(cx.theme().border)
                    .child(
                        div()
                            .flex_1()
                            .text_lg()
                            .font_semibold()
                            .child(if es_creacion {
                                "Nueva plantilla"
                            } else {
                                "Editar plantilla"
                            }),
                    )
                    .child(
                        Button::new("cancelar-plantilla")
                            .outline()
                            .small()
                            .label("Cancelar")
                            .disabled(self.guardando)
                            .on_click(cx.listener(|this, _, _, cx| {
                                this.cancelar_edicion(cx);
                            })),
                    )
                    .child(
                        Button::new("guardar-plantilla")
                            .primary()
                            .small()
                            .icon(IconName::Save)
                            .label(if self.guardando {
                                "Guardando…"
                            } else if es_creacion {
                                "Crear"
                            } else {
                                "Guardar"
                            })
                            .loading(self.guardando)
                            .disabled(self.guardando)
                            .on_click(cx.listener(|this, _, window, cx| {
                                this.guardar(window, cx);
                            })),
                    ),
            )
            .child(
                v_flex()
                    .id("formulario-plantilla")
                    .flex_1()
                    .min_h_0()
                    .overflow_y_scroll()
                    .p_6()
                    .gap_5()
                    .child(
                        v_flex()
                            .gap_1p5()
                            .child(div().text_sm().font_medium().child("Nombre"))
                            .child(Input::new(&self.editor_nombre).disabled(self.guardando))
                            .child(
                                div()
                                    .text_xs()
                                    .text_color(cx.theme().muted_foreground)
                                    .child("Nombre corto para identificar la plantilla (máx. 100 caracteres)."),
                            ),
                    )
                    .child(
                        v_flex()
                            .gap_1p5()
                            .child(div().text_sm().font_medium().child("Título de la tarea"))
                            .child(Input::new(&self.editor_titulo).disabled(self.guardando))
                            .child(
                                div()
                                    .text_xs()
                                    .text_color(cx.theme().muted_foreground)
                                    .child("Título predeterminado al crear una tarea desde esta plantilla (máx. 255 caracteres)."),
                            ),
                    )
                    .child(
                        v_flex()
                            .gap_1p5()
                            .child(div().text_sm().font_medium().child("Prioridad"))
                            .child(
                                TabBar::new("plantilla-prioridad")
                                    .segmented()
                                    .small()
                                    .selected_index(prioridad_ix)
                                    .children(Prioridad::TODAS.map(|p| p.etiqueta()))
                                    .on_click(cx.listener(|this, i: &usize, _, cx| {
                                        if let Some(&p) = Prioridad::TODAS.get(*i) {
                                            this.editor_prioridad = p;
                                            cx.notify();
                                        }
                                    })),
                            ),
                    )
                    .child(
                        v_flex()
                            .gap_2()
                            .child(div().text_sm().font_medium().child("Color"))
                            .child(
                                h_flex()
                                    .gap_2()
                                    .flex_wrap()
                                    .child(
                                        Button::new("plantilla-sin-color")
                                            .small()
                                            .label("Sin color")
                                            .when(sin_color, |b| b.primary())
                                            .when(!sin_color, |b| b.outline())
                                            .disabled(self.guardando)
                                            .on_click(cx.listener(|this, _, _, cx| {
                                                this.editor_color = None;
                                                cx.notify();
                                            })),
                                    )
                                    .children(opciones_color.into_iter().map(|hex| {
                                        let seleccionado = self
                                            .editor_color
                                            .as_deref()
                                            .is_some_and(|c| c.eq_ignore_ascii_case(&hex));
                                        let color_rgb =
                                            parsear_color_hex(Some(&hex)).unwrap_or(0x6366F1);
                                        let hex_click = hex.clone();
                                        let hex_tooltip = hex.clone();
                                        div()
                                            .id(SharedString::from(format!(
                                                "plantilla-color-{hex}"
                                            )))
                                            .size_7()
                                            .rounded_full()
                                            .bg(rgb(color_rgb))
                                            .flex()
                                            .items_center()
                                            .justify_center()
                                            .border_2()
                                            .border_color(if seleccionado {
                                                cx.theme().foreground
                                            } else {
                                                cx.theme().border.opacity(0.4)
                                            })
                                            .tooltip(move |window, cx| {
                                                gpui_kit::component::tooltip::Tooltip::new(
                                                    hex_tooltip.clone(),
                                                )
                                                .build(window, cx)
                                            })
                                            .when(seleccionado, |d| {
                                                d.child(
                                                    Icon::new(IconName::Check)
                                                        .xsmall()
                                                        .text_color(cx.theme().primary_foreground),
                                                )
                                            })
                                            .on_click(cx.listener(move |this, _, _, cx| {
                                                if !this.guardando {
                                                    this.editor_color = Some(hex_click.clone());
                                                    cx.notify();
                                                }
                                            }))
                                    })),
                            ),
                    )
                    .child(
                        v_flex()
                            .gap_2()
                            .child(div().text_sm().font_medium().child("Subtareas"))
                            .children(self.editor_subtareas.iter().map(|(sid, texto)| {
                                let sid = *sid;
                                h_flex()
                                    .id(("editor-subtarea", sid))
                                    .gap_2()
                                    .px_3()
                                    .py_1p5()
                                    .rounded(cx.theme().radius)
                                    .border_1()
                                    .border_color(cx.theme().border.opacity(0.6))
                                    .child(
                                        div()
                                            .flex_1()
                                            .min_w_0()
                                            .text_sm()
                                            .child(texto.clone()),
                                    )
                                    .child(
                                        Button::new(("quitar-subtarea", sid))
                                            .ghost()
                                            .xsmall()
                                            .icon(IconName::X)
                                            .tooltip("Quitar subtarea")
                                            .disabled(self.guardando)
                                            .on_click(cx.listener(move |this, _, _, cx| {
                                                this.quitar_subtarea(sid, cx);
                                            })),
                                    )
                            }))
                            .child(
                                h_flex()
                                    .gap_2()
                                    .child(
                                        Input::new(&self.editor_subtarea)
                                            .small()
                                            .flex_1()
                                            .disabled(self.guardando),
                                    )
                                    .child(
                                        Button::new("agregar-subtarea")
                                            .outline()
                                            .small()
                                            .icon(IconName::Plus)
                                            .label("Añadir")
                                            .disabled(self.guardando)
                                            .on_click(cx.listener(|this, _, window, cx| {
                                                this.agregar_subtarea(window, cx);
                                            })),
                                    ),
                            ),
                    )
                    .child(
                        v_flex()
                            .gap_1p5()
                            .child(div().text_sm().font_medium().child("Contenido"))
                            .child(
                                Textarea::new(&self.editor_contenido)
                                    .min_h(px(180.))
                                    .disabled(self.guardando),
                            ),
                    ),
            )
    }
}

impl Render for PlantillasView {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let filtro = self.busqueda.read(cx).value().trim().to_lowercase();
        let filtradas: Vec<&PlantillaTarea> = self
            .plantillas
            .iter()
            .filter(|p| {
                filtro.is_empty()
                    || p.nombre.to_lowercase().contains(&filtro)
                    || p.titulo.to_lowercase().contains(&filtro)
            })
            .collect();
        let filas: Vec<_> = filtradas
            .iter()
            .map(|p| self.fila(p, cx).into_any_element())
            .collect();
        let total = self.plantillas.len();
        let conteo = if total == 1 {
            "1 plantilla".to_string()
        } else {
            format!("{total} plantillas")
        };

        let seleccionada = self
            .seleccion
            .and_then(|id| self.plantillas.iter().find(|p| p.id == id))
            .cloned();

        let lista = v_flex()
            .w(px(360.))
            .h_full()
            .flex_shrink_0()
            .border_r_1()
            .border_color(cx.theme().border)
            .child(
                h_flex()
                    .p_3()
                    .gap_2()
                    .child(Input::new(&self.busqueda).small().cleanable(true).flex_1())
                    .child(
                        Button::new("nueva-plantilla")
                            .icon(IconName::Plus)
                            .small()
                            .tooltip("Nueva plantilla")
                            .on_click(cx.listener(|this, _, window, cx| {
                                this.iniciar_nueva(window, cx);
                            })),
                    )
                    .child(
                        Button::new("recargar-plantillas")
                            .icon(IconName::RefreshCw)
                            .ghost()
                            .small()
                            .tooltip("Recargar")
                            .on_click(cx.listener(|this, _, window, cx| {
                                this.cargar(window, cx);
                            })),
                    ),
            )
            .child(
                v_flex()
                    .id("lista-plantillas")
                    .flex_1()
                    .min_h_0()
                    .overflow_y_scroll()
                    .px_2()
                    .pb_2()
                    .gap_px()
                    .map(|d| match (&self.error, self.cargando, filas.is_empty()) {
                        (Some(e), _, _) => d.child(
                            div()
                                .p_2()
                                .child(Alert::error("error-plantillas", e.clone())),
                        ),
                        (None, true, true) => {
                            d.child(div().p_4().flex().justify_center().child(Spinner::new()))
                        }
                        (None, false, true) => d.child(
                            div()
                                .p_4()
                                .text_sm()
                                .text_color(cx.theme().muted_foreground)
                                .child("No hay plantillas."),
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
                    .child(conteo),
            );

        h_flex()
            .size_full()
            .child(lista)
            .child(div().flex_1().min_w_0().h_full().map(|d| {
                match self.modo {
                    ModoEditor::Creando | ModoEditor::Editando(_) => {
                        d.child(self.detalle_editor(cx))
                    }
                    ModoEditor::Lectura => match seleccionada {
                        Some(p) => d.child(self.detalle_lectura(&p, cx)),
                        None => d
                            .flex()
                            .items_center()
                            .justify_center()
                            .text_color(cx.theme().muted_foreground)
                            .child(
                                v_flex()
                                    .items_center()
                                    .gap_2()
                                    .child("Selecciona una plantilla")
                                    .child(
                                        Button::new("vacio-nueva-plantilla")
                                            .outline()
                                            .icon(IconName::Plus)
                                            .label("Nueva plantilla")
                                            .on_click(cx.listener(|this, _, window, cx| {
                                                this.iniciar_nueva(window, cx);
                                            })),
                                    ),
                            ),
                    },
                }
            }))
    }
}

fn validar_plantilla(nombre: &str, titulo: &str) -> Result<(String, String), &'static str> {
    let nombre = nombre.trim();
    if nombre.is_empty() {
        return Err("El nombre es obligatorio.");
    }
    if nombre.chars().count() > 100 {
        return Err("El nombre puede tener máximo 100 caracteres.");
    }
    let titulo = titulo.trim();
    if titulo.is_empty() {
        return Err("El título de la tarea es obligatorio.");
    }
    if titulo.chars().count() > 255 {
        return Err("El título puede tener máximo 255 caracteres.");
    }
    Ok((nombre.to_string(), titulo.to_string()))
}

/// Recorta espacios, descarta vacías y limita a 100 subtareas (misma regla que móvil/backend).
fn normalizar_subtareas<'a>(subtareas: impl IntoIterator<Item = &'a str>) -> Vec<String> {
    subtareas
        .into_iter()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .take(100)
        .map(ToString::to_string)
        .collect()
}

fn subtitulo_plantilla(p: &PlantillaTarea) -> String {
    let mut partes = vec![
        p.titulo.clone(),
        format!("Prioridad {}", p.prioridad.etiqueta().to_lowercase()),
    ];
    if !p.subtareas.is_empty() {
        partes.push(format!(
            "{} subtarea{}",
            p.subtareas.len(),
            if p.subtareas.len() == 1 { "" } else { "s" }
        ));
    }
    partes.join(" · ")
}

fn parsear_color_hex(hex: Option<&str>) -> Option<u32> {
    let limpio = hex?.trim().strip_prefix('#')?;
    if limpio.len() != 6 || !limpio.bytes().all(|b| b.is_ascii_hexdigit()) {
        return None;
    }
    u32::from_str_radix(limpio, 16).ok()
}

#[cfg(test)]
mod tests {
    use super::{
        PlantillaTarea, Prioridad, normalizar_subtareas, ruta_plantillas, subtitulo_plantilla,
        validar_plantilla,
    };

    #[test]
    fn resuelve_ruta_plantillas() {
        assert_eq!(ruta_plantillas(None), "/plantillas");
        assert_eq!(ruta_plantillas(Some(12)), "/organizaciones/12/plantillas");
    }

    #[test]
    fn valida_campos_plantilla() {
        assert!(validar_plantilla("", "Título").is_err());
        assert!(validar_plantilla("Nombre", "   ").is_err());
        let nombre_largo = "n".repeat(101);
        assert!(validar_plantilla(&nombre_largo, "Título").is_err());
        let titulo_largo = "t".repeat(256);
        assert!(validar_plantilla("Nombre", &titulo_largo).is_err());
        assert_eq!(
            validar_plantilla("  Release ", " Publicar ").unwrap(),
            ("Release".to_string(), "Publicar".to_string())
        );
    }

    #[test]
    fn normaliza_subtareas_limite_y_espacios() {
        let entrada = vec!["  Paso 1 ", "", "   ", "Paso 2"];
        assert_eq!(normalizar_subtareas(entrada), vec!["Paso 1", "Paso 2"]);

        let muchas: Vec<String> = (1..=120).map(|i| format!("Sub {i}")).collect();
        let res = normalizar_subtareas(muchas.iter().map(String::as_str));
        assert_eq!(res.len(), 100);
    }

    #[test]
    fn formatea_subtitulo_plantilla() {
        let p = PlantillaTarea {
            id: 1,
            nombre: "Release".into(),
            titulo: "Preparar versión".into(),
            contenido: String::new(),
            prioridad: Prioridad::Alta,
            color: None,
            subtareas: vec!["Tests".into(), "Tag".into()],
        };
        assert_eq!(
            subtitulo_plantilla(&p),
            "Preparar versión · Prioridad alta · 2 subtareas"
        );
    }
}
