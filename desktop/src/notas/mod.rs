//! Notas: lista ordenada con fijadas arriba, filtros por carpeta y tags,
//! menú contextual y detalle/editor completo en Markdown.

mod datos;

use gpui_kit::assets::IconName;
use gpui_kit::component::*;
use gpui_kit::component::{
    ActiveTheme, IndexPath,
    alert::Alert,
    button::{Button, ButtonVariants as _},
    input::{Input, InputEvent, InputState, Textarea, TextareaState},
    menu::{ContextMenuExt as _, PopupMenuItem},
    notification::Notification,
    select::{Select, SelectEvent, SelectState},
    spinner::Spinner,
    tag::Tag as UiTag,
    text::TextView,
};
use gpui_kit::prelude::FluentBuilder as _;
use gpui_kit::*;
use serde_json::json;

use crate::modelos::{Carpeta, Nota, Pagina, Tag};

use datos::{
    OpcionCarpeta, construir_cuerpo_actualizar, construir_cuerpo_crear, extracto_nota,
    formatear_fecha, nota_coincide_filtros, opciones_carpeta, ordenar_notas, ruta_listado,
    validar_titulo,
};

actions!(cosmoflow, [EditarNota, GuardarNota, CancelarEdicion]);

const CONTEXTO: &str = "Notas";

pub fn registrar_atajos(cx: &mut App) {
    let m = if cx.platform_info().is_mac() {
        "cmd"
    } else {
        "ctrl"
    };
    let atajo = |tecla: &str| -> &'static str { format!("{m}-{tecla}").leak() };
    cx.bind_keys([
        KeyBinding::new(atajo("e"), EditarNota, Some(CONTEXTO)),
        KeyBinding::new(atajo("s"), GuardarNota, Some(CONTEXTO)),
        KeyBinding::new("escape", CancelarEdicion, Some(CONTEXTO)),
    ]);
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum ModoEditor {
    Lectura,
    Crear,
    Editar(i64),
}

pub struct NotasView {
    busqueda: Entity<InputState>,
    ultima_busqueda: String,
    filtro_carpeta: Option<i64>,
    filtro_carpeta_select: Entity<SelectState<Vec<OpcionCarpeta>>>,
    filtro_tag: Option<i64>,
    tags: Vec<Tag>,
    carpetas: Vec<Carpeta>,
    notas: Vec<Nota>,
    total: i64,
    seleccion: Option<i64>,
    cargando: bool,
    error: Option<SharedString>,
    /// Descarta respuestas de una carga anterior si llegó una nueva petición entretanto.
    revision: u64,
    modo: ModoEditor,
    editor_titulo: Entity<InputState>,
    editor_contenido: Entity<TextareaState>,
    editor_carpeta_select: Entity<SelectState<Vec<OpcionCarpeta>>>,
    editor_tags: Vec<i64>,
    guardando: bool,
    foco: FocusHandle,
    _suscripciones: Vec<Subscription>,
}

impl NotasView {
    pub fn new(window: &mut Window, cx: &mut Context<Self>) -> Self {
        let busqueda = cx.new(|cx| InputState::new(window, cx).placeholder("Buscar notas…"));
        let filtro_carpeta_select = cx.new(|cx| {
            SelectState::new(
                opciones_carpeta(&[], "Todas las carpetas"),
                Some(IndexPath::default()),
                window,
                cx,
            )
        });
        let editor_titulo =
            cx.new(|cx| InputState::new(window, cx).placeholder("Título de la nota"));
        let editor_contenido = cx.new(|cx| {
            TextareaState::new(window, cx)
                .soft_wrap(true)
                .placeholder("Escribe tu nota en Markdown…")
        });
        let editor_carpeta_select = cx.new(|cx| {
            SelectState::new(
                opciones_carpeta(&[], "Sin carpeta"),
                Some(IndexPath::default()),
                window,
                cx,
            )
        });

        let sub_busqueda = cx.subscribe_in(&busqueda, window, |this, _, e, window, cx| {
            match e {
                InputEvent::PressEnter { .. } => {
                    this.cargar_interno(false, window, cx);
                }
                InputEvent::Change => {
                    // Al pulsar el botón de limpiar en el input, recarga automáticamente.
                    if this.busqueda.read(cx).value().trim().is_empty()
                        && !this.ultima_busqueda.is_empty()
                    {
                        this.cargar_interno(false, window, cx);
                    }
                }
                _ => {}
            }
        });
        let sub_carpeta = cx.subscribe_in(
            &filtro_carpeta_select,
            window,
            |this, _, e: &SelectEvent<Vec<OpcionCarpeta>>, window, cx| {
                let SelectEvent::Confirm(valor) = e;
                let nuevo = valor.flatten();
                if nuevo != this.filtro_carpeta {
                    this.filtro_carpeta = nuevo;
                    this.seleccion = None;
                    this.cargar_interno(false, window, cx);
                }
            },
        );

        let mut vista = Self {
            busqueda,
            ultima_busqueda: String::new(),
            filtro_carpeta: None,
            filtro_carpeta_select,
            filtro_tag: None,
            tags: vec![],
            carpetas: vec![],
            notas: vec![],
            total: 0,
            seleccion: None,
            cargando: false,
            error: None,
            revision: 0,
            modo: ModoEditor::Lectura,
            editor_titulo,
            editor_contenido,
            editor_carpeta_select,
            editor_tags: vec![],
            guardando: false,
            foco: cx.focus_handle(),
            _suscripciones: vec![sub_busqueda, sub_carpeta],
        };
        vista.cargar(window, cx);
        vista
    }

    pub fn cargar(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        self.cargar_interno(true, window, cx);
    }

    fn cargar_interno(
        &mut self,
        cargar_catalogos: bool,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        self.revision += 1;
        let revision = self.revision;
        self.cargando = true;
        self.error = None;
        cx.notify();

        let api = crate::api(cx);
        let busqueda = self.busqueda.read(cx).value().trim().to_string();
        self.ultima_busqueda = busqueda.clone();
        let ruta = ruta_listado(&busqueda, self.filtro_tag, self.filtro_carpeta);

        cx.spawn_in(window, async move |this, cx| {
            let (r_notas, r_tags, r_carpetas) = cx
                .background_spawn(async move {
                    let notas = api.get::<Pagina<Nota>>(&ruta);
                    let tags = if cargar_catalogos {
                        Some(api.get::<Pagina<Tag>>("/tags?limite=100"))
                    } else {
                        None
                    };
                    let carpetas = if cargar_catalogos {
                        Some(api.get::<Vec<Carpeta>>("/carpetas"))
                    } else {
                        None
                    };
                    (notas, tags, carpetas)
                })
                .await;

            this.update_in(cx, |this, window, cx| {
                if this.revision != revision {
                    return;
                }
                this.cargando = false;

                if let Some(Ok(p_tags)) = r_tags {
                    this.tags = p_tags.datos;
                    if let Some(tag_activo) = this.filtro_tag
                        && !this.tags.iter().any(|t| t.id == tag_activo)
                    {
                        this.filtro_tag = None;
                    }
                }
                if let Some(Ok(carpetas)) = r_carpetas {
                    this.carpetas = carpetas;
                    this.sincronizar_selectores_carpeta(window, cx);
                }

                match r_notas {
                    Ok(p) => {
                        let seleccion_anterior = this.seleccion;
                        this.total = p.total_elementos;
                        this.notas = p.datos;
                        ordenar_notas(&mut this.notas);
                        if !this.notas.iter().any(|n| Some(n.id) == this.seleccion) {
                            this.seleccion = this.notas.first().map(|n| n.id);
                        }
                        if matches!(this.modo, ModoEditor::Editar(id) if Some(id) != this.seleccion)
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

    fn sincronizar_selectores_carpeta(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        if let Some(id) = self.filtro_carpeta
            && !self.carpetas.iter().any(|c| c.id == id)
        {
            self.filtro_carpeta = None;
        }
        let filtro_ops = opciones_carpeta(&self.carpetas, "Todas las carpetas");
        let valor_filtro = self.filtro_carpeta;
        self.filtro_carpeta_select.update(cx, |select, cx| {
            select.set_items(filtro_ops, window, cx);
            select.set_selected_value(&valor_filtro, window, cx);
        });

        let editor_actual = self
            .editor_carpeta_select
            .read(cx)
            .selected_value()
            .copied()
            .flatten()
            .filter(|id| self.carpetas.iter().any(|c| c.id == *id));
        let editor_ops = opciones_carpeta(&self.carpetas, "Sin carpeta");
        self.editor_carpeta_select.update(cx, |select, cx| {
            select.set_items(editor_ops, window, cx);
            select.set_selected_value(&editor_actual, window, cx);
        });
    }

    fn filtrar_por_tag(
        &mut self,
        tag_id: Option<i64>,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        let nuevo = if self.filtro_tag == tag_id {
            None
        } else {
            tag_id
        };
        if nuevo == self.filtro_tag {
            return;
        }
        self.filtro_tag = nuevo;
        self.seleccion = None;
        self.cargar_interno(false, window, cx);
    }

    /// Abre el formulario completo en el panel derecho para crear una nota nueva.
    pub fn abrir_nueva(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        if self.guardando {
            return;
        }
        self.editor_titulo
            .update(cx, |e, cx| e.set_value(String::new(), window, cx));
        self.editor_contenido
            .update(cx, |e, cx| e.set_value(String::new(), window, cx));
        self.editor_tags.clear();
        let carpeta_inicial = self.filtro_carpeta;
        let ops = opciones_carpeta(&self.carpetas, "Sin carpeta");
        self.editor_carpeta_select.update(cx, |select, cx| {
            select.set_items(ops, window, cx);
            select.set_selected_value(&carpeta_inicial, window, cx);
        });
        self.modo = ModoEditor::Crear;
        self.editor_titulo
            .read(cx)
            .focus_handle(cx)
            .focus(window, cx);
        cx.notify();
    }

    fn seleccionar(&mut self, id: i64, window: &mut Window, cx: &mut Context<Self>) {
        if self.guardando {
            return;
        }
        if self.seleccion != Some(id) || self.modo != ModoEditor::Lectura {
            self.seleccion = Some(id);
            self.modo = ModoEditor::Lectura;
        }
        self.foco.focus(window, cx);
        cx.notify();
    }

    fn iniciar_edicion(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        if let Some(id) = self.seleccion {
            self.iniciar_edicion_nota(id, window, cx);
        }
    }

    fn iniciar_edicion_nota(&mut self, id: i64, window: &mut Window, cx: &mut Context<Self>) {
        if self.guardando || self.modo == ModoEditor::Editar(id) {
            return;
        }
        let Some(nota) = self.notas.iter().find(|n| n.id == id).cloned() else {
            return;
        };
        self.seleccion = Some(id);
        self.editor_titulo
            .update(cx, |e, cx| e.set_value(nota.titulo, window, cx));
        self.editor_contenido
            .update(cx, |e, cx| e.set_value(nota.contenido, window, cx));
        self.editor_tags = nota.tag_ids;
        let ops = opciones_carpeta(&self.carpetas, "Sin carpeta");
        let carpeta_id = nota.carpeta_id;
        self.editor_carpeta_select.update(cx, |select, cx| {
            select.set_items(ops, window, cx);
            select.set_selected_value(&carpeta_id, window, cx);
        });
        self.modo = ModoEditor::Editar(id);
        self.editor_contenido
            .read(cx)
            .focus_handle(cx)
            .focus(window, cx);
        cx.notify();
    }

    fn cancelar_edicion(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        if self.modo == ModoEditor::Lectura || self.guardando {
            return;
        }
        self.modo = ModoEditor::Lectura;
        self.foco.focus(window, cx);
        cx.notify();
    }

    fn alternar_tag_editor(&mut self, tag_id: i64, cx: &mut Context<Self>) {
        if self.guardando {
            return;
        }
        if let Some(pos) = self.editor_tags.iter().position(|id| *id == tag_id) {
            self.editor_tags.remove(pos);
        } else {
            self.editor_tags.push(tag_id);
        }
        cx.notify();
    }

    fn guardar_edicion(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        if self.modo == ModoEditor::Lectura || self.guardando {
            return;
        }
        let titulo = match validar_titulo(&self.editor_titulo.read(cx).value()) {
            Ok(t) => t,
            Err(msg) => {
                window.push_notification(Notification::error(msg), cx);
                return;
            }
        };
        let contenido = self.editor_contenido.read(cx).value().to_string();
        let carpeta_id = self
            .editor_carpeta_select
            .read(cx)
            .selected_value()
            .copied()
            .flatten();
        let tag_ids = self.editor_tags.clone();
        let modo = self.modo;

        self.guardando = true;
        cx.notify();

        let api = crate::api(cx);
        match modo {
            ModoEditor::Crear => {
                let cuerpo = construir_cuerpo_crear(&titulo, &contenido, carpeta_id, &tag_ids);
                cx.spawn_in(window, async move |this, cx| {
                    let r = cx
                        .background_spawn(async move { api.post::<Nota>("/notas", cuerpo) })
                        .await;
                    this.update_in(cx, |this, window, cx| {
                        this.guardando = false;
                        match r {
                            Ok(creada) => {
                                this.modo = ModoEditor::Lectura;
                                if nota_coincide_filtros(
                                    &creada,
                                    this.filtro_tag,
                                    this.filtro_carpeta,
                                ) {
                                    let id = creada.id;
                                    this.notas.insert(0, creada);
                                    ordenar_notas(&mut this.notas);
                                    this.total += 1;
                                    this.seleccion = Some(id);
                                } else {
                                    this.cargar_interno(false, window, cx);
                                    window.push_notification(
                                        Notification::success("Nota creada."),
                                        cx,
                                    );
                                }
                                this.foco.focus(window, cx);
                            }
                            Err(e) => window.push_notification(Notification::error(e.mensaje), cx),
                        }
                        cx.notify();
                    })
                    .ok();
                })
                .detach();
            }
            ModoEditor::Editar(id) => {
                let color_actual = self
                    .notas
                    .iter()
                    .find(|n| n.id == id)
                    .and_then(|n| n.color.clone());
                let cuerpo = construir_cuerpo_actualizar(
                    &titulo,
                    &contenido,
                    color_actual.as_deref(),
                    carpeta_id,
                    &tag_ids,
                );
                cx.spawn_in(window, async move |this, cx| {
                    let r = cx
                        .background_spawn(async move {
                            api.put::<Nota>(&format!("/notas/{id}"), cuerpo)
                        })
                        .await;
                    this.update_in(cx, |this, window, cx| {
                        this.guardando = false;
                        match r {
                            Ok(actualizada) => {
                                this.modo = ModoEditor::Lectura;
                                if nota_coincide_filtros(
                                    &actualizada,
                                    this.filtro_tag,
                                    this.filtro_carpeta,
                                ) {
                                    if let Some(local) =
                                        this.notas.iter_mut().find(|n| n.id == actualizada.id)
                                    {
                                        *local = actualizada;
                                    }
                                    ordenar_notas(&mut this.notas);
                                } else {
                                    this.notas.retain(|n| n.id != actualizada.id);
                                    this.total = (this.total - 1).max(0);
                                    this.seleccion = this.notas.first().map(|n| n.id);
                                }
                                this.foco.focus(window, cx);
                            }
                            Err(e) => window.push_notification(Notification::error(e.mensaje), cx),
                        }
                        cx.notify();
                    })
                    .ok();
                })
                .detach();
            }
            ModoEditor::Lectura => {}
        }
    }

    fn alternar_fijada(
        &mut self,
        id: i64,
        fijar: bool,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        let api = crate::api(cx);
        let cuerpo = json!({ "isFijada": fijar });
        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(async move { api.put::<Nota>(&format!("/notas/{id}"), cuerpo) })
                .await;
            this.update_in(cx, |this, window, cx| {
                match r {
                    Ok(actualizada) => {
                        if let Some(local) = this.notas.iter_mut().find(|n| n.id == actualizada.id)
                        {
                            *local = actualizada;
                        }
                        ordenar_notas(&mut this.notas);
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
        let titulo = self
            .notas
            .iter()
            .find(|n| n.id == id)
            .map(|n| n.titulo.clone())
            .unwrap_or_default();
        let mensaje = if titulo.is_empty() {
            "Irá a la papelera; puedes restaurarla desde la web.".to_string()
        } else {
            format!("«{titulo}» irá a la papelera; puedes restaurarla desde la web.")
        };
        let vista = cx.entity().downgrade();
        window.open_alert_dialog(cx, move |dialog, _, _| {
            let vista = vista.clone();
            dialog
                .title("¿Eliminar la nota?")
                .child(mensaje.clone())
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

    fn eliminar(&mut self, id: i64, window: &mut Window, cx: &mut Context<Self>) {
        let api = crate::api(cx);
        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(async move { api.delete(&format!("/notas/{id}")) })
                .await;
            this.update_in(cx, |this, window, cx| {
                match r {
                    Ok(()) => {
                        this.notas.retain(|n| n.id != id);
                        this.total = (this.total - 1).max(0);
                        if this.seleccion == Some(id) {
                            this.modo = ModoEditor::Lectura;
                            this.seleccion = this.notas.first().map(|n| n.id);
                        }
                        window.push_notification(
                            Notification::success("Nota enviada a la papelera."),
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

    fn nombre_carpeta(&self, carpeta_id: Option<i64>) -> Option<&str> {
        let id = carpeta_id?;
        self.carpetas
            .iter()
            .find(|c| c.id == id)
            .map(|c| c.nombre.as_str())
    }

    fn fila(&self, n: &Nota, cx: &mut Context<Self>) -> impl IntoElement {
        let id = n.id;
        let is_fijada = n.is_fijada;
        let seleccionada = self.seleccion == Some(id);
        let carpeta = if self.filtro_carpeta.is_none() {
            self.nombre_carpeta(n.carpeta_id)
        } else {
            None
        };
        let extracto = extracto_nota(&n.contenido, carpeta);
        let vista = cx.entity().downgrade();

        v_flex()
            .id(("nota", id as u64))
            .gap_1()
            .px_3()
            .py_2()
            .rounded(cx.theme().radius)
            .when(seleccionada, |d| d.bg(cx.theme().accent))
            .hover(|d| d.bg(cx.theme().accent.opacity(0.6)))
            .on_click(cx.listener(move |this, _, window, cx| {
                this.seleccionar(id, window, cx);
            }))
            .child(
                h_flex()
                    .gap_2()
                    .when(is_fijada, |d| {
                        d.child(
                            Icon::new(IconName::Pin)
                                .small()
                                .text_color(cx.theme().muted_foreground),
                        )
                    })
                    .child(
                        div()
                            .flex_1()
                            .min_w_0()
                            .truncate()
                            .text_sm()
                            .font_medium()
                            .child(n.titulo.clone()),
                    )
                    .child(
                        div()
                            .text_xs()
                            .text_color(cx.theme().muted_foreground)
                            .child(formatear_fecha(&n.updated_at).to_string()),
                    ),
            )
            .when_some(extracto, |d, texto| {
                d.child(
                    div()
                        .w_full()
                        .min_w_0()
                        .truncate()
                        .text_xs()
                        .text_color(cx.theme().muted_foreground)
                        .child(texto),
                )
            })
            .context_menu(move |menu, _, _| {
                let vista_editar = vista.clone();
                let vista_fijar = vista.clone();
                let vista_eliminar = vista.clone();
                menu.item(
                    PopupMenuItem::new("Editar")
                        .icon(IconName::Pencil)
                        .on_click(move |_, window, cx| {
                            vista_editar
                                .update(cx, |v, cx| v.iniciar_edicion_nota(id, window, cx))
                                .ok();
                        }),
                )
                .item(
                    PopupMenuItem::new(if is_fijada { "Desfijar" } else { "Fijar" })
                        .icon(if is_fijada {
                            IconName::PinOff
                        } else {
                            IconName::Pin
                        })
                        .on_click(move |_, window, cx| {
                            vista_fijar
                                .update(cx, |v, cx| v.alternar_fijada(id, !is_fijada, window, cx))
                                .ok();
                        }),
                )
                .separator()
                .item(
                    PopupMenuItem::new("Eliminar")
                        .icon(IconName::Delete)
                        .on_click(move |_, window, cx| {
                            vista_eliminar
                                .update(cx, |v, cx| v.confirmar_eliminar(id, window, cx))
                                .ok();
                        }),
                )
            })
    }

    fn detalle_lectura(&self, n: &Nota, cx: &mut Context<Self>) -> impl IntoElement {
        let id = n.id;
        let is_fijada = n.is_fijada;
        let fecha = formatear_fecha(&n.updated_at).to_string();
        let carpeta = self.nombre_carpeta(n.carpeta_id).map(str::to_string);
        let tags_nota: Vec<String> = self
            .tags
            .iter()
            .filter(|t| n.tag_ids.contains(&t.id))
            .map(|t| t.nombre.clone())
            .collect();
        let tiene_metadatos = carpeta.is_some() || !tags_nota.is_empty();

        v_flex()
            .id("detalle-nota")
            .size_full()
            .overflow_y_scroll()
            .p_6()
            .gap_4()
            .child(
                h_flex()
                    .gap_2()
                    .items_start()
                    .child(
                        v_flex()
                            .flex_1()
                            .min_w_0()
                            .gap_1()
                            .child(
                                h_flex()
                                    .gap_2()
                                    .when(is_fijada, |d| {
                                        d.child(
                                            Icon::new(IconName::Pin)
                                                .small()
                                                .text_color(cx.theme().muted_foreground),
                                        )
                                    })
                                    .child(
                                        div()
                                            .flex_1()
                                            .min_w_0()
                                            .text_xl()
                                            .font_semibold()
                                            .child(n.titulo.clone()),
                                    ),
                            )
                            .child(
                                div()
                                    .text_xs()
                                    .text_color(cx.theme().muted_foreground)
                                    .child(format!("Actualizada: {fecha}")),
                            ),
                    )
                    .child(
                        Button::new("fijar-nota")
                            .icon(if is_fijada {
                                IconName::PinOff
                            } else {
                                IconName::Pin
                            })
                            .label(if is_fijada { "Desfijar" } else { "Fijar" })
                            .outline()
                            .small()
                            .on_click(cx.listener(move |this, _, window, cx| {
                                this.alternar_fijada(id, !is_fijada, window, cx);
                            })),
                    )
                    .child(
                        Button::new("editar-nota")
                            .icon(IconName::Pencil)
                            .label("Editar")
                            .outline()
                            .small()
                            .on_click(cx.listener(|this, _, window, cx| {
                                this.iniciar_edicion(window, cx);
                            })),
                    )
                    .child(
                        Button::new("eliminar-nota")
                            .icon(IconName::Delete)
                            .ghost()
                            .small()
                            .tooltip("Eliminar")
                            .on_click(cx.listener(move |this, _, window, cx| {
                                this.confirmar_eliminar(id, window, cx);
                            })),
                    ),
            )
            .when(tiene_metadatos, |d| {
                d.child(
                    h_flex()
                        .flex_wrap()
                        .gap_2()
                        .when_some(carpeta, |row, nombre| {
                            row.child(
                                UiTag::secondary().small().child(
                                    h_flex()
                                        .gap_1()
                                        .child(Icon::new(IconName::Folder).xsmall())
                                        .child(nombre),
                                ),
                            )
                        })
                        .children(
                            tags_nota
                                .into_iter()
                                .map(|nombre| UiTag::secondary().outline().small().child(nombre)),
                        ),
                )
            })
            .child(div().h_px().w_full().bg(cx.theme().border))
            .child(if n.contenido.trim().is_empty() {
                div()
                    .text_sm()
                    .text_color(cx.theme().muted_foreground)
                    .child("Sin contenido. Pulsa Editar para escribir.")
                    .into_any_element()
            } else {
                TextView::markdown(("contenido-nota", id as u64), n.contenido.clone())
                    .selectable(true)
                    .into_any_element()
            })
    }

    fn detalle_edicion(&self, cx: &mut Context<Self>) -> impl IntoElement {
        let es_creacion = self.modo == ModoEditor::Crear;
        let etiqueta_guardar = match (self.guardando, es_creacion) {
            (true, _) => "Guardando…",
            (false, true) => "Crear",
            (false, false) => "Guardar",
        };
        let tiene_metadatos = !self.carpetas.is_empty() || !self.tags.is_empty();

        v_flex()
            .id("editor-nota")
            .size_full()
            .p_6()
            .gap_4()
            .child(
                h_flex()
                    .gap_2()
                    .child(
                        Input::new(&self.editor_titulo)
                            .flex_1()
                            .disabled(self.guardando),
                    )
                    .child(
                        Button::new("cancelar-nota")
                            .label("Cancelar")
                            .outline()
                            .small()
                            .disabled(self.guardando)
                            .on_click(cx.listener(|this, _, window, cx| {
                                this.cancelar_edicion(window, cx);
                            })),
                    )
                    .child(
                        Button::new("guardar-nota")
                            .primary()
                            .small()
                            .icon(IconName::Save)
                            .label(etiqueta_guardar)
                            .loading(self.guardando)
                            .disabled(self.guardando)
                            .on_click(cx.listener(|this, _, window, cx| {
                                this.guardar_edicion(window, cx);
                            })),
                    ),
            )
            .when(tiene_metadatos, |d| {
                d.child(
                    v_flex()
                        .gap_3()
                        .when(!self.carpetas.is_empty(), |col| {
                            col.child(
                                h_flex()
                                    .gap_3()
                                    .child(
                                        div()
                                            .text_xs()
                                            .font_medium()
                                            .text_color(cx.theme().muted_foreground)
                                            .child("Carpeta"),
                                    )
                                    .child(
                                        div().w_64().child(
                                            Select::new(&self.editor_carpeta_select)
                                                .small()
                                                .icon(IconName::Folder)
                                                .placeholder("Sin carpeta")
                                                .disabled(self.guardando),
                                        ),
                                    ),
                            )
                        })
                        .when(!self.tags.is_empty(), |col| {
                            col.child(
                                v_flex()
                                    .gap_1p5()
                                    .child(
                                        div()
                                            .text_xs()
                                            .font_medium()
                                            .text_color(cx.theme().muted_foreground)
                                            .child("Tags"),
                                    )
                                    .child(h_flex().flex_wrap().gap_1p5().children(
                                        self.tags.iter().map(|tag| {
                                            let tag_id = tag.id;
                                            let activo = self.editor_tags.contains(&tag_id);
                                            Button::new(("editor-tag", tag_id as u64))
                                                .xsmall()
                                                .label(tag.nombre.clone())
                                                .disabled(self.guardando)
                                                .when(activo, |b| b.primary().icon(IconName::Check))
                                                .when(!activo, |b| b.outline())
                                                .on_click(cx.listener(move |this, _, _, cx| {
                                                    this.alternar_tag_editor(tag_id, cx);
                                                }))
                                        }),
                                    )),
                            )
                        }),
                )
            })
            .child(
                Textarea::new(&self.editor_contenido)
                    .flex_1()
                    .min_h_0()
                    .disabled(self.guardando),
            )
    }
}

impl Render for NotasView {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let seleccionada = self
            .seleccion
            .and_then(|id| self.notas.iter().find(|n| n.id == id))
            .cloned();
        let filas: Vec<_> = self
            .notas
            .iter()
            .map(|n| self.fila(n, cx).into_any_element())
            .collect();

        let conteo = if self.total == 1 {
            "1 nota".to_string()
        } else {
            format!("{} notas", self.total)
        };

        let cabecera = v_flex()
            .p_3()
            .gap_2p5()
            .child(
                h_flex()
                    .gap_2()
                    .child(Input::new(&self.busqueda).small().cleanable(true).flex_1())
                    .child(
                        Button::new("nueva-nota")
                            .icon(IconName::Plus)
                            .small()
                            .tooltip("Nueva nota")
                            .on_click(cx.listener(|this, _, window, cx| {
                                this.abrir_nueva(window, cx);
                            })),
                    ),
            )
            .when(!self.carpetas.is_empty(), |col| {
                col.child(
                    Select::new(&self.filtro_carpeta_select)
                        .small()
                        .icon(IconName::Folder)
                        .placeholder("Todas las carpetas"),
                )
            })
            .when(!self.tags.is_empty(), |col| {
                col.child(
                    h_flex()
                        .flex_wrap()
                        .gap_1p5()
                        .child(
                            Button::new("filtro-tag-todos")
                                .xsmall()
                                .label("Todos")
                                .when(self.filtro_tag.is_none(), |b| b.primary())
                                .when(self.filtro_tag.is_some(), |b| b.outline())
                                .on_click(cx.listener(|this, _, window, cx| {
                                    this.filtrar_por_tag(None, window, cx);
                                })),
                        )
                        .children(self.tags.iter().map(|tag| {
                            let tag_id = tag.id;
                            let activo = self.filtro_tag == Some(tag_id);
                            Button::new(("filtro-tag", tag_id as u64))
                                .xsmall()
                                .label(tag.nombre.clone())
                                .when(activo, |b| b.primary())
                                .when(!activo, |b| b.outline())
                                .on_click(cx.listener(move |this, _, window, cx| {
                                    this.filtrar_por_tag(Some(tag_id), window, cx);
                                }))
                        })),
                )
            });

        let lista = v_flex()
            .w(px(380.))
            .h_full()
            .flex_shrink_0()
            .border_r_1()
            .border_color(cx.theme().border)
            .child(cabecera)
            .child(
                v_flex()
                    .id("lista-notas")
                    .flex_1()
                    .min_h_0()
                    .overflow_y_scroll()
                    .px_2()
                    .pb_2()
                    .gap_px()
                    .map(|d| match (&self.error, self.cargando, filas.is_empty()) {
                        (Some(e), _, _) => {
                            d.child(div().p_2().child(Alert::error("error-notas", e.clone())))
                        }
                        (None, true, true) => {
                            d.child(div().p_4().flex().justify_center().child(Spinner::new()))
                        }
                        (None, false, true) => d.child(
                            div()
                                .p_4()
                                .text_sm()
                                .text_color(cx.theme().muted_foreground)
                                .child("No hay notas aquí."),
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
            .id("notas")
            .size_full()
            .track_focus(&self.foco)
            .key_context(CONTEXTO)
            .on_action(cx.listener(|this, _: &EditarNota, window, cx| {
                this.iniciar_edicion(window, cx);
            }))
            .on_action(cx.listener(|this, _: &GuardarNota, window, cx| {
                this.guardar_edicion(window, cx);
            }))
            .on_action(cx.listener(|this, _: &CancelarEdicion, window, cx| {
                this.cancelar_edicion(window, cx);
            }))
            .child(lista)
            .child(div().flex_1().min_w_0().h_full().map(|d| {
                if self.modo != ModoEditor::Lectura {
                    d.child(self.detalle_edicion(cx))
                } else if let Some(n) = seleccionada {
                    d.child(self.detalle_lectura(&n, cx))
                } else {
                    d.flex()
                        .items_center()
                        .justify_center()
                        .text_color(cx.theme().muted_foreground)
                        .child(
                            v_flex()
                                .items_center()
                                .gap_2()
                                .child("Selecciona una nota")
                                .child(
                                    Button::new("vacio-nueva-nota")
                                        .label("Nueva nota")
                                        .on_click(cx.listener(|this, _, window, cx| {
                                            this.abrir_nueva(window, cx);
                                        })),
                                ),
                        )
                }
            }))
    }
}
