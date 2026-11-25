//! Editor completo de tareas (mismos campos que `mobile/.../tarea_form.dart`), en un panel lateral.
//! Crear: plantilla opcional, título, descripción, prioridad, estado, fechas, color, subtareas,
//! responsables (solo en organizaciones) y tags.

use std::collections::BTreeSet;
use std::rc::Rc;

use gpui_kit::assets::IconName;
use gpui_kit::component::*;
use gpui_kit::component::{
    ActiveTheme,
    alert::Alert,
    button::{Button, ButtonVariants as _},
    date_picker::{DatePicker, DatePickerState},
    input::{Input, InputEvent, InputState, Textarea, TextareaState},
    notification::Notification,
    select::{Select, SelectEvent, SelectState},
    tab::TabBar,
};
use gpui_kit::prelude::FluentBuilder as _;
use gpui_kit::*;
use serde::Deserialize;
use serde_json::{Value, json};

use crate::modelos::{EstadoTarea, Pagina, Prioridad, Tag, Tarea};

/// Paleta de acentos de móvil (`selector_color.dart`).
const COLORES: [&str; 8] = [
    "#6366F1", "#4F46E5", "#E11D48", "#059669", "#D97706", "#0284C7", "#7C3AED", "#0D9488",
];

/// Organización/proyecto donde se crea la tarea; vacío = tarea personal.
#[derive(Clone, Copy, Default)]
pub struct Ambito {
    pub organizacion_id: Option<i64>,
    pub proyecto_id: Option<i64>,
    pub equipo_id: Option<i64>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Plantilla {
    nombre: String,
    titulo: String,
    contenido: String,
    prioridad: Prioridad,
    color: Option<String>,
    subtareas: Vec<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Miembro {
    usuario_id: i64,
    nombre: String,
}

/// Lo que el formulario envía; separado de la UI para poder probar el cuerpo.
#[derive(Debug, Clone, PartialEq)]
struct Valores {
    titulo: String,
    contenido: String,
    estado: EstadoTarea,
    prioridad: Prioridad,
    fecha_inicio: Option<String>,
    fecha_vencimiento: Option<String>,
    color: Option<String>,
    subtareas: Vec<(String, bool)>,
    tag_ids: Vec<i64>,
    responsable_ids: Vec<i64>,
}

impl Valores {
    fn validar(&self) -> Result<(), &'static str> {
        if self.titulo.trim().is_empty() {
            return Err("El título es obligatorio.");
        }
        // Fechas ISO `AAAA-MM-DD`: el orden de texto es el cronológico.
        if let (Some(ini), Some(ven)) = (&self.fecha_inicio, &self.fecha_vencimiento)
            && ven < ini
        {
            return Err("El vencimiento debe ser posterior al inicio.");
        }
        Ok(())
    }

    fn cuerpo(&self, ambito: Ambito, nueva: bool) -> Value {
        let mut c = json!({
            "titulo": self.titulo.trim(),
            "contenido": self.contenido,
            "estado": self.estado.api(),
            "prioridad": self.prioridad.api(),
            "fechaInicio": self.fecha_inicio,
            "fechaVencimiento": self.fecha_vencimiento,
            "color": self.color,
            "tagIds": self.tag_ids,
            "subtareas": self.subtareas.iter()
                .map(|(t, hecha)| json!({ "titulo": t, "completada": hecha }))
                .collect::<Vec<_>>(),
        });
        if ambito.organizacion_id.is_some() {
            c["responsableIds"] = json!(self.responsable_ids);
        }
        if nueva {
            if let Some(o) = ambito.organizacion_id {
                c["organizacionId"] = json!(o);
            }
            if let Some(p) = ambito.proyecto_id {
                c["proyectoId"] = json!(p);
            }
            if let Some(e) = ambito.equipo_id {
                c["equipoId"] = json!(e);
            }
        }
        c
    }
}

type AlGuardar = Rc<dyn Fn(Tarea, &mut Window, &mut App)>;

pub struct EditorTarea {
    id: Option<i64>,
    ambito: Ambito,
    titulo: Entity<InputState>,
    contenido: Entity<TextareaState>,
    estado: EstadoTarea,
    prioridad: Prioridad,
    inicio: Entity<DatePickerState>,
    vence: Entity<DatePickerState>,
    color: Option<String>,
    subtareas: Vec<(String, bool)>,
    nueva_subtarea: Entity<InputState>,
    tags: Vec<Tag>,
    tags_elegidos: BTreeSet<i64>,
    miembros: Vec<Miembro>,
    responsables: BTreeSet<i64>,
    plantillas: Vec<Plantilla>,
    selector_plantilla: Entity<SelectState<Vec<SharedString>>>,
    guardando: bool,
    error: Option<SharedString>,
    al_guardar: AlGuardar,
    _suscripciones: Vec<Subscription>,
}

/// Abre el editor: `tarea = None` crea una nueva en `ambito` con el `estado` dado.
pub fn abrir(
    tarea: Option<Tarea>,
    ambito: Ambito,
    estado: EstadoTarea,
    al_guardar: impl Fn(Tarea, &mut Window, &mut App) + 'static,
    window: &mut Window,
    cx: &mut App,
) {
    let titulo_panel = if tarea.is_some() {
        "Editar tarea"
    } else {
        "Nueva tarea"
    };
    let editor =
        cx.new(|cx| EditorTarea::new(tarea, ambito, estado, Rc::new(al_guardar), window, cx));
    editor
        .read(cx)
        .titulo
        .read(cx)
        .focus_handle(cx)
        .focus(window, cx);
    window.open_sheet(cx, move |sheet, _, cx| {
        let guardar = editor.downgrade();
        let guardando = editor.read(cx).guardando;
        sheet
            .title(titulo_panel)
            .size(px(560.))
            .child(editor.clone())
            .footer(
                h_flex()
                    .w_full()
                    .justify_end()
                    .gap_2()
                    .child(
                        Button::new("cancelar-tarea")
                            .label("Cancelar")
                            .outline()
                            .on_click(|_, window, cx| window.close_sheet(cx)),
                    )
                    .child(
                        Button::new("guardar-tarea")
                            .label("Guardar")
                            .primary()
                            .loading(guardando)
                            .on_click(move |_, window, cx| {
                                guardar.update(cx, |e, cx| e.guardar(window, cx)).ok();
                            }),
                    ),
            )
    });
}

impl EditorTarea {
    fn new(
        tarea: Option<Tarea>,
        ambito: Ambito,
        estado: EstadoTarea,
        al_guardar: AlGuardar,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) -> Self {
        let t = tarea.as_ref();
        let ambito = Ambito {
            organizacion_id: t.and_then(|t| t.organizacion_id).or(ambito.organizacion_id),
            proyecto_id: t.and_then(|t| t.proyecto_id).or(ambito.proyecto_id),
            equipo_id: ambito.equipo_id,
        };
        let texto = |v: Option<&String>| v.cloned().unwrap_or_default();
        let titulo = cx.new(|cx| {
            InputState::new(window, cx)
                .placeholder("¿Qué hay que hacer?")
                .default_value(texto(t.map(|t| &t.titulo)))
        });
        let contenido = cx.new(|cx| {
            TextareaState::new(window, cx)
                .soft_wrap(true)
                .placeholder("Detalles, pasos… (Markdown)")
                .default_value(texto(t.map(|t| &t.contenido)))
        });
        // Igual que móvil: una tarea nueva vence en 4 días.
        let vence_inicial = match t {
            Some(t) => t.fecha_vencimiento.clone(),
            None => jiff::ZonedDateTime::now()
                .date()
                .checked_add(jiff::Span::new().days(4))
                .ok()
                .map(|d| d.to_string()),
        };
        let fecha = |valor: Option<String>, window: &mut Window, cx: &mut Context<Self>| {
            cx.new(|cx| {
                let mut s = DatePickerState::new(window, cx);
                if let Some(d) = valor.as_deref().and_then(a_fecha) {
                    s.set_date(d, window, cx);
                }
                s
            })
        };
        let inicio = fecha(t.and_then(|t| t.fecha_inicio.clone()), window, cx);
        let vence = fecha(vence_inicial, window, cx);
        let nueva_subtarea =
            cx.new(|cx| InputState::new(window, cx).placeholder("Añadir subtarea y pulsar Enter"));
        let selector_plantilla = cx.new(|cx| SelectState::new(Vec::new(), None, window, cx));
        let subs = vec![
            cx.subscribe_in(&nueva_subtarea, window, |this, input, e, window, cx| {
                if matches!(e, InputEvent::PressEnter { .. }) {
                    let texto = input.read(cx).value().trim().to_string();
                    if !texto.is_empty() {
                        this.subtareas.push((texto, false));
                        input.update(cx, |i, cx| i.set_value("", window, cx));
                        cx.notify();
                    }
                }
            }),
            cx.subscribe_in(
                &selector_plantilla,
                window,
                |this, select, _: &SelectEvent<Vec<SharedString>>, window, cx| {
                    if let Some(i) = select.read(cx).selected_index(cx) {
                        this.aplicar_plantilla(i.row, window, cx);
                    }
                },
            ),
        ];
        let mut editor = Self {
            id: t.map(|t| t.id),
            ambito,
            titulo,
            contenido,
            estado: t.map_or(estado, |t| t.estado),
            prioridad: t.map_or(Prioridad::Media, |t| t.prioridad),
            inicio,
            vence,
            color: t.and_then(|t| t.color.clone()),
            subtareas: t.map_or(vec![], |t| {
                t.subtareas
                    .iter()
                    .map(|s| (s.titulo.clone(), s.completada))
                    .collect()
            }),
            nueva_subtarea,
            tags: vec![],
            tags_elegidos: t.map_or(BTreeSet::new(), |t| t.tag_ids.iter().copied().collect()),
            miembros: vec![],
            responsables: t.map_or(BTreeSet::new(), |t| {
                t.responsable_ids.iter().copied().collect()
            }),
            plantillas: vec![],
            selector_plantilla,
            guardando: false,
            error: None,
            al_guardar,
            _suscripciones: subs,
        };
        editor.cargar_opciones(window, cx);
        editor
    }

    /// Tags, miembros (si es de organización) y plantillas (solo al crear).
    fn cargar_opciones(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        let api = crate::api(cx);
        let org = self.ambito.organizacion_id;
        let nueva = self.id.is_none();
        cx.spawn_in(window, async move |this, cx| {
            let (tags, miembros, plantillas) = cx
                .background_spawn(async move {
                    // shortcut: primera página de 100 tags; paginar si alguien tiene más.
                    let tags = match org {
                        Some(o) => {
                            api.get::<Pagina<Tag>>(&format!("/organizaciones/{o}/tags?limite=100"))
                        }
                        None => api.get::<Pagina<Tag>>("/tags?limite=100"),
                    }
                    .map(|p| p.datos);
                    let miembros = match org {
                        Some(o) => api
                            .get::<Vec<Miembro>>(&format!("/organizaciones/{o}/miembros"))
                            .unwrap_or_default(),
                        None => vec![],
                    };
                    let mut plantillas = vec![];
                    if nueva {
                        plantillas
                            .extend(api.get::<Vec<Plantilla>>("/plantillas").unwrap_or_default());
                        if let Some(o) = org {
                            plantillas.extend(
                                api.get::<Vec<Plantilla>>(&format!(
                                    "/organizaciones/{o}/plantillas"
                                ))
                                .unwrap_or_default(),
                            );
                        }
                    }
                    (tags, miembros, plantillas)
                })
                .await;
            this.update_in(cx, |this, window, cx| {
                match tags {
                    Ok(t) => this.tags = t,
                    Err(e) => this.error = Some(format!("No se cargaron los tags: {e}").into()),
                }
                this.miembros = miembros;
                let nombres = plantillas.iter().map(|p| p.nombre.clone().into()).collect();
                this.plantillas = plantillas;
                this.selector_plantilla
                    .update(cx, |s, cx| s.set_items(nombres, window, cx));
                cx.notify();
            })
            .ok();
        })
        .detach();
    }

    /// RN-60 (móvil): la plantilla rellena título, contenido, prioridad, color y subtareas; nunca tags.
    fn aplicar_plantilla(&mut self, i: usize, window: &mut Window, cx: &mut Context<Self>) {
        let Some(p) = self.plantillas.get(i).cloned() else {
            return;
        };
        self.titulo
            .update(cx, |s, cx| s.set_value(p.titulo, window, cx));
        self.contenido
            .update(cx, |s, cx| s.set_value(p.contenido, window, cx));
        self.prioridad = p.prioridad;
        self.color = p.color;
        self.subtareas = p.subtareas.into_iter().map(|t| (t, false)).collect();
        cx.notify();
    }

    fn valores(&self, cx: &App) -> Valores {
        let fecha = |s: &Entity<DatePickerState>| s.read(cx).date().start().map(|d| d.to_string());
        Valores {
            titulo: self.titulo.read(cx).value().to_string(),
            contenido: self.contenido.read(cx).value().to_string(),
            estado: self.estado,
            prioridad: self.prioridad,
            fecha_inicio: fecha(&self.inicio),
            fecha_vencimiento: fecha(&self.vence),
            color: self.color.clone(),
            subtareas: self.subtareas.clone(),
            tag_ids: self.tags_elegidos.iter().copied().collect(),
            responsable_ids: self.responsables.iter().copied().collect(),
        }
    }

    fn guardar(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        if self.guardando {
            return;
        }
        let valores = self.valores(cx);
        if let Err(e) = valores.validar() {
            self.error = Some(e.into());
            cx.notify();
            return;
        }
        self.guardando = true;
        self.error = None;
        cx.notify();
        let api = crate::api(cx);
        let id = self.id;
        let cuerpo = valores.cuerpo(self.ambito, id.is_none());
        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(async move {
                    match id {
                        Some(id) => api.put::<Tarea>(&format!("/tareas/{id}"), cuerpo),
                        None => api.post::<Tarea>("/tareas", cuerpo),
                    }
                })
                .await;
            this.update_in(cx, |this, window, cx| {
                this.guardando = false;
                match r {
                    Ok(t) => {
                        window.close_sheet(cx);
                        window.push_notification(
                            Notification::success(if id.is_some() {
                                "Tarea guardada."
                            } else {
                                "Tarea creada."
                            }),
                            cx,
                        );
                        (this.al_guardar)(t, window, cx);
                    }
                    Err(e) => this.error = Some(e.mensaje.into()),
                }
                cx.notify();
            })
            .ok();
        })
        .detach();
    }

    fn seccion(titulo: &'static str, cx: &App) -> Div {
        div()
            .text_sm()
            .font_medium()
            .text_color(cx.theme().muted_foreground)
            .child(titulo)
    }

    fn chip(
        id: impl Into<ElementId>,
        etiqueta: SharedString,
        activo: bool,
        al_pulsar: impl Fn(&mut Self, &mut Context<Self>) + 'static,
        cx: &mut Context<Self>,
    ) -> Button {
        Button::new(id)
            .small()
            .label(etiqueta)
            .when(activo, |b| b.primary().icon(IconName::Check))
            .when(!activo, |b| b.outline())
            .on_click(cx.listener(move |this, _, _, cx| {
                al_pulsar(this, cx);
                cx.notify();
            }))
    }
}

/// `"2026-11-24"` (o con hora) → fecha civil para el selector.
fn a_fecha(s: &str) -> Option<jiff::civil::Date> {
    s.get(..10)?.parse().ok()
}

impl Render for EditorTarea {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let prioridades = Prioridad::TODAS;
        let estados = EstadoTarea::TODOS;
        v_flex()
            .gap_5()
            .pb_4()
            .when_some(self.error.clone(), |d, e| {
                d.child(Alert::error("error-editor", e))
            })
            .when(self.id.is_none() && !self.plantillas.is_empty(), |d| {
                d.child(
                    v_flex()
                        .gap_2()
                        .child(Self::seccion("Desde plantilla", cx))
                        .child(
                            Select::new(&self.selector_plantilla)
                                .placeholder("Sin plantilla")
                                .icon(IconName::LayoutTemplate),
                        ),
                )
            })
            .child(
                v_flex()
                    .gap_2()
                    .child(Self::seccion("Título", cx))
                    .child(Input::new(&self.titulo)),
            )
            .child(
                v_flex()
                    .gap_2()
                    .child(Self::seccion("Descripción", cx))
                    .child(Textarea::new(&self.contenido).h(px(160.))),
            )
            .child(
                h_flex()
                    .gap_4()
                    .items_start()
                    .child(
                        v_flex()
                            .gap_2()
                            .child(Self::seccion("Prioridad", cx))
                            .child(
                                TabBar::new("prioridad")
                                    .segmented()
                                    .small()
                                    .selected_index(
                                        prioridades
                                            .iter()
                                            .position(|p| *p == self.prioridad)
                                            .unwrap_or(1),
                                    )
                                    .children(prioridades.map(|p| p.etiqueta()))
                                    .on_click(cx.listener(move |this, i: &usize, _, cx| {
                                        this.prioridad = prioridades[*i];
                                        cx.notify();
                                    })),
                            ),
                    )
                    .child(
                        v_flex().gap_2().child(Self::seccion("Estado", cx)).child(
                            TabBar::new("estado")
                                .segmented()
                                .small()
                                .selected_index(
                                    estados.iter().position(|e| *e == self.estado).unwrap_or(0),
                                )
                                .children(estados.map(|e| e.etiqueta()))
                                .on_click(cx.listener(move |this, i: &usize, _, cx| {
                                    this.estado = estados[*i];
                                    cx.notify();
                                })),
                        ),
                    ),
            )
            .child(
                h_flex()
                    .gap_4()
                    .child(
                        v_flex()
                            .flex_1()
                            .gap_2()
                            .child(Self::seccion("Inicio", cx))
                            .child(
                                DatePicker::new(&self.inicio)
                                    .placeholder("Sin fecha")
                                    .cleanable(true),
                            ),
                    )
                    .child(
                        v_flex()
                            .flex_1()
                            .gap_2()
                            .child(Self::seccion("Vence", cx))
                            .child(
                                DatePicker::new(&self.vence)
                                    .placeholder("Sin fecha")
                                    .cleanable(true),
                            ),
                    ),
            )
            .child(
                v_flex().gap_2().child(Self::seccion("Color", cx)).child(
                    h_flex()
                        .gap_2()
                        .child(
                            Button::new("sin-color")
                                .small()
                                .label("Ninguno")
                                .when(self.color.is_none(), |b| b.primary())
                                .when(self.color.is_some(), |b| b.ghost())
                                .on_click(cx.listener(|this, _, _, cx| {
                                    this.color = None;
                                    cx.notify();
                                })),
                        )
                        .children(COLORES.map(|hex| {
                            let activo = self
                                .color
                                .as_deref()
                                .is_some_and(|c| c.eq_ignore_ascii_case(hex));
                            div()
                                .id(hex)
                                .size_6()
                                .rounded_full()
                                .cursor_pointer()
                                .bg(color_hex(hex))
                                .border_2()
                                .border_color(if activo {
                                    cx.theme().foreground
                                } else {
                                    gpui_kit::transparent_black()
                                })
                                .on_click(cx.listener(move |this, _, _, cx| {
                                    this.color = Some(hex.into());
                                    cx.notify();
                                }))
                        })),
                ),
            )
            .child(
                v_flex()
                    .gap_2()
                    .child(Self::seccion("Subtareas", cx))
                    .children(self.subtareas.iter().enumerate().map(|(i, (titulo, _))| {
                        h_flex()
                            .gap_2()
                            .child(
                                div()
                                    .flex_1()
                                    .min_w_0()
                                    .truncate()
                                    .text_sm()
                                    .child(titulo.clone()),
                            )
                            .child(
                                Button::new(("quitar-subtarea", i))
                                    .icon(IconName::X)
                                    .ghost()
                                    .xsmall()
                                    .tooltip("Quitar subtarea")
                                    .on_click(cx.listener(move |this, _, _, cx| {
                                        this.subtareas.remove(i);
                                        cx.notify();
                                    })),
                            )
                    }))
                    .child(Input::new(&self.nueva_subtarea).small()),
            )
            .when(!self.miembros.is_empty(), |d| {
                let chips: Vec<_> = self
                    .miembros
                    .iter()
                    .map(|m| {
                        let id = m.usuario_id;
                        Self::chip(
                            ("responsable", id as u64),
                            m.nombre.clone().into(),
                            self.responsables.contains(&id),
                            move |this, _| alternar(&mut this.responsables, id),
                            cx,
                        )
                    })
                    .collect();
                d.child(
                    v_flex()
                        .gap_2()
                        .child(Self::seccion("Responsables", cx))
                        .child(h_flex().flex_wrap().gap_2().children(chips)),
                )
            })
            .when(!self.tags.is_empty(), |d| {
                let chips: Vec<_> = self
                    .tags
                    .iter()
                    .map(|t| {
                        let id = t.id;
                        Self::chip(
                            ("tag", id as u64),
                            t.nombre.clone().into(),
                            self.tags_elegidos.contains(&id),
                            move |this, _| alternar(&mut this.tags_elegidos, id),
                            cx,
                        )
                    })
                    .collect();
                d.child(
                    v_flex()
                        .gap_2()
                        .child(Self::seccion("Tags", cx))
                        .child(h_flex().flex_wrap().gap_2().children(chips)),
                )
            })
    }
}

fn alternar(conjunto: &mut BTreeSet<i64>, id: i64) {
    if !conjunto.remove(&id) {
        conjunto.insert(id);
    }
}

/// `#RRGGBB` → color; gris si no es válido.
pub fn color_hex(hex: &str) -> Hsla {
    u32::from_str_radix(hex.trim_start_matches('#'), 16)
        .map(|v| rgb(v).into())
        .unwrap_or_else(|_| gpui_kit::hsla(0., 0., 0.5, 1.))
}

#[cfg(test)]
mod tests {
    // Sin `super::*`: arrastraría la macro `test` de gpui.
    use super::{Ambito, Valores, a_fecha};
    use crate::modelos::{EstadoTarea, Prioridad};
    use serde_json::json;

    fn valores() -> Valores {
        Valores {
            titulo: "  Preparar demo ".into(),
            contenido: String::new(),
            estado: EstadoTarea::Pendiente,
            prioridad: Prioridad::Alta,
            fecha_inicio: Some("2026-11-20".into()),
            fecha_vencimiento: Some("2026-11-24".into()),
            color: Some("#E11D48".into()),
            subtareas: vec![("Guion".into(), true)],
            tag_ids: vec![3],
            responsable_ids: vec![7],
        }
    }

    #[test]
    fn valida_titulo_y_orden_de_fechas() {
        assert!(valores().validar().is_ok());
        let mut v = valores();
        v.titulo = "  ".into();
        assert!(v.validar().is_err());
        let mut v = valores();
        v.fecha_vencimiento = Some("2026-11-19".into());
        assert!(v.validar().is_err());
    }

    #[test]
    fn cuerpo_personal_sin_responsables_ni_ambito() {
        let c = valores().cuerpo(Ambito::default(), true);
        assert_eq!(c["titulo"], "Preparar demo");
        assert_eq!(c["prioridad"], "alta");
        assert_eq!(c["subtareas"][0]["completada"], true);
        assert!(c.get("responsableIds").is_none() && c.get("organizacionId").is_none());
    }

    #[test]
    fn cuerpo_de_organizacion_solo_manda_ambito_al_crear() {
        let ambito = Ambito {
            organizacion_id: Some(1),
            proyecto_id: Some(2),
            equipo_id: None,
        };
        let nueva = valores().cuerpo(ambito, true);
        assert_eq!(
            (nueva["organizacionId"].clone(), nueva["proyectoId"].clone()),
            (json!(1), json!(2))
        );
        assert_eq!(nueva["responsableIds"], json!([7]));
        assert!(
            valores()
                .cuerpo(ambito, false)
                .get("organizacionId")
                .is_none()
        );
    }

    #[test]
    fn lee_fechas_con_o_sin_hora() {
        assert_eq!(a_fecha("2026-11-24").unwrap().to_string(), "2026-11-24");
        assert_eq!(a_fecha("2026-11-24T10:00:00Z").unwrap().day(), 24);
        assert!(a_fecha("ayer").is_none());
    }
}
