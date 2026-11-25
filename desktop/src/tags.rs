//! Tags: lista con búsqueda y CRUD completo (nombre y color) mediante diálogos.

use gpui_kit::assets::IconName;
use gpui_kit::component::*;
use gpui_kit::component::{
    ActiveTheme,
    alert::Alert,
    button::{Button, ButtonVariants as _},
    dialog::DialogButtonProps,
    input::{Input, InputEvent, InputState},
    notification::Notification,
    spinner::Spinner,
};
use gpui_kit::prelude::FluentBuilder as _;
use gpui_kit::*;
use serde_json::json;

use crate::modelos::{Pagina, Tag};

const COLORES_PRESET: [&str; 5] = ["#4F46E5", "#E11D48", "#059669", "#D97706", "#0284C7"];

struct SelectorColorTag {
    color: Option<String>,
}

impl SelectorColorTag {
    fn new(color: Option<String>) -> Self {
        Self { color }
    }
}

impl Render for SelectorColorTag {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let actual = self.color.as_deref().map(str::to_lowercase);
        let sin_color = actual.as_deref().is_none_or(str::is_empty);

        let mut opciones: Vec<String> = COLORES_PRESET.iter().map(|&c| c.to_string()).collect();
        if let Some(color_actual) = &self.color
            && !color_actual.trim().is_empty()
            && !opciones
                .iter()
                .any(|c| c.eq_ignore_ascii_case(color_actual))
        {
            opciones.push(color_actual.clone());
        }

        h_flex()
            .gap_2()
            .flex_wrap()
            .child(
                Button::new("tag-sin-color")
                    .small()
                    .label("Sin color")
                    .when(sin_color, |b| b.primary())
                    .when(!sin_color, |b| b.outline())
                    .on_click(cx.listener(|this, _, _, cx| {
                        this.color = None;
                        cx.notify();
                    })),
            )
            .children(opciones.into_iter().map(|hex| {
                let seleccionado = actual
                    .as_deref()
                    .is_some_and(|a| a.eq_ignore_ascii_case(&hex));
                let color_rgb = parsear_color_hex(Some(&hex)).unwrap_or(0x6366F1);
                let hex_click = hex.clone();
                let hex_tooltip = hex.clone();
                div()
                    .id(SharedString::from(format!("color-preset-{hex}")))
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
                        gpui_kit::component::tooltip::Tooltip::new(hex_tooltip.clone())
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
                        this.color = Some(hex_click.clone());
                        cx.notify();
                    }))
            }))
    }
}

pub struct TagsView {
    busqueda: Entity<InputState>,
    tags: Vec<Tag>,
    total: i64,
    cargando: bool,
    error: Option<SharedString>,
    /// Descarta respuestas viejas si llega otra búsqueda antes de terminar la anterior.
    revision: u64,
    _suscripciones: Vec<Subscription>,
}

impl TagsView {
    pub fn new(window: &mut Window, cx: &mut Context<Self>) -> Self {
        let busqueda = cx.new(|cx| InputState::new(window, cx).placeholder("Filtrar por nombre…"));
        let sub = cx.subscribe_in(&busqueda, window, |this, _, e, window, cx| {
            if matches!(e, InputEvent::PressEnter { .. }) {
                this.cargar(window, cx);
            }
        });
        let mut vista = Self {
            busqueda,
            tags: Vec::new(),
            total: 0,
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
        let mut ruta = "/tags?limite=100".to_string();
        if !busqueda.is_empty() {
            ruta.push_str(&format!("&nombre={}", crate::api::codificar(&busqueda)));
        }

        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(async move { api.get::<Pagina<Tag>>(&ruta) })
                .await;
            this.update(cx, |this, cx| {
                if this.revision != revision {
                    return;
                }
                this.cargando = false;
                match r {
                    Ok(p) => {
                        this.total = p.total_elementos;
                        this.tags = p.datos;
                    }
                    Err(e) => this.error = Some(e.mensaje.into()),
                }
                cx.notify();
            })
            .ok();
        })
        .detach();
    }

    fn abrir_formulario(&mut self, tag: Option<Tag>, window: &mut Window, cx: &mut Context<Self>) {
        let es_edicion = tag.is_some();
        let id_edicion = tag.as_ref().map(|t| t.id);
        let nombre_inicial = tag.as_ref().map(|t| t.nombre.clone()).unwrap_or_default();
        let color_inicial = tag.and_then(|t| t.color);

        let nombre_input = cx.new(|cx| {
            InputState::new(window, cx)
                .placeholder("Ej. Urgente, Backend, Diseño")
                .default_value(nombre_inicial)
        });
        if !es_edicion {
            nombre_input.read(cx).focus_handle(cx).focus(window, cx);
        }
        let color_picker = cx.new(|_| SelectorColorTag::new(color_inicial));

        let vista = cx.entity().downgrade();
        let guardar = {
            let nombre_input = nombre_input.clone();
            let color_picker = color_picker.clone();
            move |window: &mut Window, cx: &mut App| -> bool {
                let raw_nombre = nombre_input.read(cx).value().to_string();
                let nombre = match validar_nombre_tag(&raw_nombre) {
                    Ok(n) => n,
                    Err(msg) => {
                        window.push_notification(Notification::error(msg), cx);
                        return false;
                    }
                };
                let color = color_picker
                    .read(cx)
                    .color
                    .clone()
                    .filter(|c| !c.trim().is_empty());
                vista
                    .update(cx, |v, cx| v.guardar(id_edicion, nombre, color, window, cx))
                    .ok();
                true
            }
        };

        let guardar_enter = guardar.clone();
        let _ = window.subscribe(&nombre_input, cx, move |_, e: &InputEvent, window, cx| {
            if matches!(e, InputEvent::PressEnter { .. }) && guardar_enter(window, cx) {
                window.close_dialog(cx);
            }
        });

        window.open_dialog(cx, move |dialog, _, cx| {
            let guardar = guardar.clone();
            dialog
                .title(if es_edicion {
                    "Editar tag"
                } else {
                    "Nuevo tag"
                })
                .w(px(440.))
                .child(
                    v_flex()
                        .gap_4()
                        .child(
                            v_flex()
                                .gap_1p5()
                                .child(div().text_sm().font_medium().child("Nombre"))
                                .child(Input::new(&nombre_input))
                                .child(
                                    div()
                                        .text_xs()
                                        .text_color(cx.theme().muted_foreground)
                                        .child("Máximo 64 caracteres."),
                                ),
                        )
                        .child(
                            v_flex()
                                .gap_2()
                                .child(div().text_sm().font_medium().child("Color"))
                                .child(color_picker.clone()),
                        ),
                )
                .button_props(
                    DialogButtonProps::default()
                        .ok_text("Guardar")
                        .show_cancel(true)
                        .cancel_text("Cancelar"),
                )
                .on_ok(move |_, window, cx| guardar(window, cx))
        });
    }

    fn guardar(
        &mut self,
        id: Option<i64>,
        nombre: String,
        color: Option<String>,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        let api = crate::api(cx);
        let cuerpo = json!({ "nombre": nombre, "color": color });
        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(async move {
                    match id {
                        Some(id) => api.put::<Tag>(&format!("/tags/{id}"), cuerpo),
                        None => api.post::<Tag>("/tags", cuerpo),
                    }
                })
                .await;
            this.update_in(cx, |this, window, cx| match r {
                Ok(_) => {
                    window.push_notification(
                        Notification::success(if id.is_some() {
                            "Tag actualizado."
                        } else {
                            "Tag creado."
                        }),
                        cx,
                    );
                    this.cargar(window, cx);
                }
                Err(e) => window.push_notification(Notification::error(e.mensaje), cx),
            })
            .ok();
        })
        .detach();
    }

    fn confirmar_eliminar(&mut self, tag: Tag, window: &mut Window, cx: &mut Context<Self>) {
        let vista = cx.entity().downgrade();
        let id = tag.id;
        window.open_alert_dialog(cx, move |dialog, _, _| {
            let vista = vista.clone();
            dialog
                .title("¿Eliminar tag?")
                .child(format!(
                    "«{}» se quitará de todas sus tareas y notas.",
                    tag.nombre
                ))
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
                .background_spawn(async move { api.delete(&format!("/tags/{id}")) })
                .await;
            this.update_in(cx, |this, window, cx| {
                match r {
                    Ok(()) => {
                        this.tags.retain(|t| t.id != id);
                        this.total = (this.total - 1).max(0);
                        window.push_notification(Notification::success("Tag eliminado."), cx);
                    }
                    Err(e) => window.push_notification(Notification::error(e.mensaje), cx),
                }
                cx.notify();
            })
            .ok();
        })
        .detach();
    }

    fn fila(&self, tag: &Tag, cx: &mut Context<Self>) -> impl IntoElement {
        let id = tag.id;
        let tag_editar = tag.clone();
        let tag_eliminar = tag.clone();
        let color_hex = parsear_color_hex(tag.color.as_deref());

        h_flex()
            .id(("tag", id as u64))
            .w_full()
            .gap_3()
            .px_4()
            .py_2p5()
            .rounded(cx.theme().radius)
            .border_1()
            .border_color(cx.theme().border.opacity(0.6))
            .hover(|d| d.bg(cx.theme().accent.opacity(0.5)))
            .on_click(cx.listener(move |this, _, window, cx| {
                this.abrir_formulario(Some(tag_editar.clone()), window, cx);
            }))
            .child(
                div()
                    .w_5()
                    .flex()
                    .items_center()
                    .justify_center()
                    .child(match color_hex {
                        Some(hex) => div()
                            .size_3()
                            .rounded_full()
                            .bg(rgb(hex))
                            .into_any_element(),
                        None => Icon::new(IconName::Tag)
                            .small()
                            .text_color(cx.theme().muted_foreground)
                            .into_any_element(),
                    }),
            )
            .child(
                div()
                    .flex_1()
                    .min_w_0()
                    .truncate()
                    .text_sm()
                    .font_medium()
                    .child(tag.nombre.clone()),
            )
            .when_some(
                tag.color.clone().filter(|c| !c.trim().is_empty()),
                |d, hex| {
                    d.child(
                        div()
                            .text_xs()
                            .text_color(cx.theme().muted_foreground)
                            .child(hex),
                    )
                },
            )
            .child(
                Button::new(("editar-tag", id as u64))
                    .icon(IconName::Pencil)
                    .ghost()
                    .small()
                    .tooltip("Editar")
                    .on_click(cx.listener({
                        let tag = tag.clone();
                        move |this, _, window, cx| {
                            cx.stop_propagation();
                            this.abrir_formulario(Some(tag.clone()), window, cx);
                        }
                    })),
            )
            .child(
                Button::new(("eliminar-tag", id as u64))
                    .icon(IconName::Delete)
                    .ghost()
                    .small()
                    .tooltip("Eliminar")
                    .on_click(cx.listener(move |this, _, window, cx| {
                        cx.stop_propagation();
                        this.confirmar_eliminar(tag_eliminar.clone(), window, cx);
                    })),
            )
    }
}

impl Render for TagsView {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let filas: Vec<_> = self
            .tags
            .iter()
            .map(|t| self.fila(t, cx).into_any_element())
            .collect();
        let conteo = if self.total == 1 {
            "1 tag".to_string()
        } else {
            format!("{} tags", self.total)
        };

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
                            .child(div().text_lg().font_semibold().child("Tags"))
                            .child(
                                div()
                                    .text_xs()
                                    .text_color(cx.theme().muted_foreground)
                                    .child("Organiza tus tareas y notas con etiquetas."),
                            ),
                    )
                    .child(
                        div()
                            .w(px(240.))
                            .child(Input::new(&self.busqueda).small().cleanable(true)),
                    )
                    .child(
                        Button::new("nuevo-tag")
                            .outline()
                            .small()
                            .icon(IconName::Plus)
                            .label("Nuevo tag")
                            .on_click(cx.listener(|this, _, window, cx| {
                                this.abrir_formulario(None, window, cx);
                            })),
                    )
                    .child(
                        Button::new("recargar-tags")
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
                    .id("lista-tags")
                    .flex_1()
                    .min_h_0()
                    .overflow_y_scroll()
                    .p_6()
                    .gap_2()
                    .map(|d| match (&self.error, self.cargando, filas.is_empty()) {
                        (Some(e), _, _) => d.child(Alert::error("error-tags", e.clone())),
                        (None, true, true) => d.child(
                            div()
                                .flex_1()
                                .flex()
                                .items_center()
                                .justify_center()
                                .py_12()
                                .child(Spinner::new()),
                        ),
                        (None, false, true) => d.child(
                            v_flex()
                                .flex_1()
                                .items_center()
                                .justify_center()
                                .py_12()
                                .gap_3()
                                .text_color(cx.theme().muted_foreground)
                                .child(Icon::new(IconName::Tags).size_6())
                                .child(div().text_sm().font_medium().child("Sin etiquetas"))
                                .child(
                                    div()
                                        .text_xs()
                                        .child("Crea etiquetas para organizar tus tareas y notas."),
                                )
                                .child(
                                    Button::new("vacio-nuevo-tag")
                                        .outline()
                                        .small()
                                        .icon(IconName::Plus)
                                        .label("Nuevo tag")
                                        .on_click(cx.listener(|this, _, window, cx| {
                                            this.abrir_formulario(None, window, cx);
                                        })),
                                ),
                        ),
                        _ => d.children(filas),
                    }),
            )
            .child(
                div()
                    .px_6()
                    .py_2()
                    .border_t_1()
                    .border_color(cx.theme().border)
                    .text_xs()
                    .text_color(cx.theme().muted_foreground)
                    .child(conteo),
            )
    }
}

fn validar_nombre_tag(nombre: &str) -> Result<String, &'static str> {
    let limpio = nombre.trim();
    if limpio.is_empty() {
        return Err("El nombre es obligatorio.");
    }
    if limpio.chars().count() > 64 {
        return Err("Máximo 64 caracteres.");
    }
    Ok(limpio.to_string())
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
    use super::{parsear_color_hex, validar_nombre_tag};

    #[test]
    fn valida_nombre_tag() {
        assert!(validar_nombre_tag("").is_err());
        assert!(validar_nombre_tag("   ").is_err());
        let largo = "a".repeat(65);
        assert!(validar_nombre_tag(&largo).is_err());
        assert_eq!(validar_nombre_tag("  Urgente  ").unwrap(), "Urgente");
    }

    #[test]
    fn parsea_colores_hex() {
        assert_eq!(parsear_color_hex(Some("#4F46E5")), Some(0x4F46E5));
        assert_eq!(parsear_color_hex(Some(" #059669 ")), Some(0x059669));
        assert_eq!(parsear_color_hex(Some("4F46E5")), None);
        assert_eq!(parsear_color_hex(Some("#12345")), None);
        assert_eq!(parsear_color_hex(Some("#GGGGGG")), None);
        assert_eq!(parsear_color_hex(None), None);
    }
}
