//! Notas: lista ordenada con fijadas arriba (maestro) y detalle/edición markdown.

use gpui_kit::assets::IconName;
use gpui_kit::component::*;
use gpui_kit::component::{
    ActiveTheme,
    alert::Alert,
    button::{Button, ButtonVariants as _},
    input::{Input, InputEvent, InputState, Textarea, TextareaState},
    notification::Notification,
    spinner::Spinner,
    text::TextView,
};
use gpui_kit::prelude::FluentBuilder as _;
use gpui_kit::*;
use serde_json::json;

use crate::modelos::{Nota, Pagina};

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

pub struct NotasView {
    busqueda: Entity<InputState>,
    editor_titulo: Entity<InputState>,
    editor_contenido: Entity<TextareaState>,
    notas: Vec<Nota>,
    total: i64,
    seleccion: Option<i64>,
    cargando: bool,
    error: Option<SharedString>,
    /// Descarta respuestas de una carga anterior si llegó una nueva búsqueda entretanto.
    revision: u64,
    editando: bool,
    guardando: bool,
    foco: FocusHandle,
    _suscripciones: Vec<Subscription>,
}

impl NotasView {
    pub fn new(window: &mut Window, cx: &mut Context<Self>) -> Self {
        let busqueda = cx.new(|cx| InputState::new(window, cx).placeholder("Buscar notas…"));
        let editor_titulo =
            cx.new(|cx| InputState::new(window, cx).placeholder("Título de la nota"));
        let editor_contenido = cx.new(|cx| {
            TextareaState::new(window, cx)
                .soft_wrap(true)
                .placeholder("Escribe tu nota en Markdown…")
        });
        let sub = cx.subscribe_in(&busqueda, window, |this, _, e, window, cx| {
            if matches!(e, InputEvent::PressEnter { .. }) {
                this.cargar(window, cx);
            }
        });
        let mut vista = Self {
            busqueda,
            editor_titulo,
            editor_contenido,
            notas: vec![],
            total: 0,
            seleccion: None,
            cargando: false,
            error: None,
            revision: 0,
            editando: false,
            guardando: false,
            foco: cx.focus_handle(),
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
        // shortcut: primera página de 100; paginar si alguien supera 100 notas.
        let mut ruta = "/notas?limite=100".to_string();
        if !busqueda.is_empty() {
            ruta.push_str(&format!("&busqueda={}", crate::api::codificar(&busqueda)));
        }
        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(async move { api.get::<Pagina<Nota>>(&ruta) })
                .await;
            this.update(cx, |this, cx| {
                if this.revision != revision {
                    return;
                }
                this.cargando = false;
                match r {
                    Ok(p) => {
                        let seleccion_anterior = this.seleccion;
                        this.total = p.total_elementos;
                        this.notas = p.datos;
                        ordenar_notas(&mut this.notas);
                        if !this.notas.iter().any(|n| Some(n.id) == this.seleccion) {
                            this.seleccion = this.notas.first().map(|n| n.id);
                        }
                        if this.seleccion != seleccion_anterior {
                            this.editando = false;
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

    /// Diálogo con el título de la nueva nota; Enter la crea de inmediato.
    pub fn abrir_nueva(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        let titulo = cx.new(|cx| InputState::new(window, cx).placeholder("Título de la nota"));
        titulo.read(cx).focus_handle(cx).focus(window, cx);
        let vista = cx.entity().downgrade();
        let crear = {
            let titulo = titulo.clone();
            move |window: &mut Window, cx: &mut App| {
                let texto = titulo.read(cx).value().trim().to_string();
                if texto.is_empty() {
                    return false;
                }
                vista.update(cx, |v, cx| v.crear(texto, window, cx)).ok();
                true
            }
        };
        let crear_enter = crear.clone();
        let _ = window.subscribe(&titulo, cx, move |_, e: &InputEvent, window, cx| {
            if matches!(e, InputEvent::PressEnter { .. }) && crear_enter(window, cx) {
                window.close_dialog(cx);
            }
        });
        window.open_dialog(cx, move |dialog, _, _| {
            let crear = crear.clone();
            dialog
                .title("Nueva nota")
                .w(px(440.))
                .child(Input::new(&titulo))
                .button_props(
                    gpui_kit::component::dialog::DialogButtonProps::default()
                        .ok_text("Crear")
                        .show_cancel(true)
                        .cancel_text("Cancelar"),
                )
                .on_ok(move |_, window, cx| crear(window, cx))
        });
    }

    fn crear(&mut self, titulo: String, window: &mut Window, cx: &mut Context<Self>) {
        let api = crate::api(cx);
        cx.spawn_in(window, async move |this, cx| {
            let cuerpo = json!({ "titulo": titulo, "contenido": "" });
            let r = cx
                .background_spawn(async move { api.post::<Nota>("/notas", cuerpo) })
                .await;
            this.update_in(cx, |this, window, cx| {
                match r {
                    Ok(n) => {
                        let id = n.id;
                        this.notas.insert(0, n);
                        ordenar_notas(&mut this.notas);
                        this.total += 1;
                        this.seleccion = Some(id);
                        this.editando = false;
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

    fn seleccionar(&mut self, id: i64, window: &mut Window, cx: &mut Context<Self>) {
        if self.guardando {
            return;
        }
        if self.seleccion != Some(id) {
            self.seleccion = Some(id);
            self.editando = false;
        }
        self.foco.focus(window, cx);
        cx.notify();
    }

    fn iniciar_edicion(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        if self.editando {
            return;
        }
        let Some(nota) = self
            .seleccion
            .and_then(|id| self.notas.iter().find(|n| n.id == id))
            .cloned()
        else {
            return;
        };
        self.editor_titulo
            .update(cx, |e, cx| e.set_value(nota.titulo, window, cx));
        self.editor_contenido
            .update(cx, |e, cx| e.set_value(nota.contenido, window, cx));
        self.editando = true;
        self.editor_contenido
            .read(cx)
            .focus_handle(cx)
            .focus(window, cx);
        cx.notify();
    }

    fn cancelar_edicion(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        if !self.editando || self.guardando {
            return;
        }
        self.editando = false;
        self.foco.focus(window, cx);
        cx.notify();
    }

    fn guardar_edicion(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        if !self.editando || self.guardando {
            return;
        }
        let Some(id) = self.seleccion else {
            return;
        };
        let titulo = self.editor_titulo.read(cx).value().trim().to_string();
        if titulo.is_empty() {
            window.push_notification(Notification::error("El título no puede estar vacío."), cx);
            return;
        }
        let contenido = self.editor_contenido.read(cx).value().to_string();
        self.guardando = true;
        cx.notify();

        let api = crate::api(cx);
        cx.spawn_in(window, async move |this, cx| {
            let cuerpo = json!({ "titulo": titulo, "contenido": contenido });
            let r = cx
                .background_spawn(async move { api.put::<Nota>(&format!("/notas/{id}"), cuerpo) })
                .await;
            this.update_in(cx, |this, window, cx| {
                this.guardando = false;
                match r {
                    Ok(actualizada) => {
                        this.editando = false;
                        if let Some(local) = this.notas.iter_mut().find(|n| n.id == actualizada.id)
                        {
                            *local = actualizada;
                        }
                        ordenar_notas(&mut this.notas);
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

    fn confirmar_eliminar(&mut self, id: i64, window: &mut Window, cx: &mut Context<Self>) {
        let vista = cx.entity().downgrade();
        window.open_alert_dialog(cx, move |dialog, _, _| {
            let vista = vista.clone();
            dialog
                .title("¿Eliminar la nota?")
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
                            this.editando = false;
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

    fn fila(&self, n: &Nota, cx: &mut Context<Self>) -> impl IntoElement {
        let id = n.id;
        let seleccionada = self.seleccion == Some(id);
        h_flex()
            .id(("nota", id as u64))
            .gap_2()
            .px_3()
            .py_2()
            .rounded(cx.theme().radius)
            .when(seleccionada, |d| d.bg(cx.theme().accent))
            .hover(|d| d.bg(cx.theme().accent.opacity(0.6)))
            .on_click(cx.listener(move |this, _, window, cx| {
                this.seleccionar(id, window, cx);
            }))
            .when(n.is_fijada, |d| {
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
                    .child(n.titulo.clone()),
            )
            .child(
                div()
                    .text_xs()
                    .text_color(cx.theme().muted_foreground)
                    .child(formatear_fecha(&n.updated_at).to_string()),
            )
    }

    fn detalle_lectura(&self, n: &Nota, cx: &mut Context<Self>) -> impl IntoElement {
        let id = n.id;
        let fecha = formatear_fecha(&n.updated_at).to_string();
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
                                    .when(n.is_fijada, |d| {
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
                            .label(if self.guardando {
                                "Guardando…"
                            } else {
                                "Guardar"
                            })
                            .loading(self.guardando)
                            .disabled(self.guardando)
                            .on_click(cx.listener(|this, _, window, cx| {
                                this.guardar_edicion(window, cx);
                            })),
                    ),
            )
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

        let lista = v_flex()
            .w(px(380.))
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
                        Button::new("nueva-nota")
                            .icon(IconName::Plus)
                            .small()
                            .tooltip("Nueva nota")
                            .on_click(cx.listener(|this, _, window, cx| {
                                this.abrir_nueva(window, cx);
                            })),
                    ),
            )
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
                match (seleccionada, self.editando) {
                    (Some(_), true) => d.child(self.detalle_edicion(cx)),
                    (Some(n), false) => d.child(self.detalle_lectura(&n, cx)),
                    (None, _) => d
                        .flex()
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
                        ),
                }
            }))
    }
}

/// Ordena fijadas primero y luego por fecha de actualización descendente.
fn ordenar_notas(notas: &mut [Nota]) {
    notas.sort_by(|a, b| {
        b.is_fijada
            .cmp(&a.is_fijada)
            .then_with(|| b.updated_at.cmp(&a.updated_at))
            .then_with(|| b.id.cmp(&a.id))
    });
}

/// Extrae `YYYY-MM-DD` de una marca ISO-8601 para mostrarla en la lista y cabecera.
fn formatear_fecha(iso: &str) -> &str {
    iso.split('T').next().unwrap_or(iso)
}

#[cfg(test)]
mod tests {
    use crate::modelos::Nota;

    #[test]
    fn formatea_fecha_iso() {
        assert_eq!(super::formatear_fecha("2026-10-28T10:00:00Z"), "2026-10-28");
        assert_eq!(super::formatear_fecha("2026-10-28"), "2026-10-28");
    }

    #[test]
    fn ordena_fijadas_arriba_y_recientes_primero() {
        let mut notas = vec![
            Nota {
                id: 1,
                titulo: "Antigua".into(),
                contenido: String::new(),
                is_fijada: false,
                updated_at: "2026-10-01T10:00:00Z".into(),
            },
            Nota {
                id: 2,
                titulo: "Fijada vieja".into(),
                contenido: String::new(),
                is_fijada: true,
                updated_at: "2026-09-01T10:00:00Z".into(),
            },
            Nota {
                id: 3,
                titulo: "Reciente".into(),
                contenido: String::new(),
                is_fijada: false,
                updated_at: "2026-10-20T10:00:00Z".into(),
            },
        ];
        super::ordenar_notas(&mut notas);
        let ids: Vec<_> = notas.iter().map(|n| n.id).collect();
        assert_eq!(ids, vec![2, 3, 1]);
    }
}
