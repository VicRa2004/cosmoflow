//! Diálogos y formularios reactivos de organizaciones, proyectos, equipos, roles e invitaciones.

use std::cell::Cell;

use gpui_kit::assets::IconName;
use gpui_kit::component::ActiveTheme;
use gpui_kit::component::alert::Alert;
use gpui_kit::component::button::{Button, ButtonVariants as _};
use gpui_kit::component::checkbox::Checkbox;
use gpui_kit::component::dialog::DialogFooter;
use gpui_kit::component::input::{Input, InputEvent, InputState, Textarea, TextareaState};
use gpui_kit::component::notification::Notification;
use gpui_kit::component::*;
use gpui_kit::prelude::FluentBuilder as _;
use gpui_kit::*;
use serde_json::json;

use crate::modelos::{
    CatalogoPermisosOrganizacion, Equipo, EstadoProyecto, MiembroOrganizacion, Organizacion,
    Proyecto, RolOrganizacion, Tag,
};

use super::OrganizacionesView;
use super::datos::{
    COLORES_ACENTO, PERMISOS_POR_DEFECTO, etiqueta_permiso, parsear_color_hex, validar_email,
    validar_equipo, validar_nombre_y_desc, validar_proyecto,
};

fn campo_etiqueta(texto: &'static str, cx: &App) -> Div {
    div()
        .text_xs()
        .font_medium()
        .text_color(cx.theme().muted_foreground)
        .child(texto)
}

fn render_selector_color(
    id_prefijo: &'static str,
    seleccionado: Option<&str>,
    opcional: bool,
    on_elegir: impl Fn(Option<String>, &mut Window, &mut App) + Clone + 'static,
    cx: &App,
) -> impl IntoElement {
    let actual = seleccionado.map(|s| s.to_ascii_lowercase());
    let sin_color = actual.as_deref().is_none_or(str::is_empty);

    v_flex().gap_1p5().child(campo_etiqueta("Color", cx)).child(
        h_flex()
            .flex_wrap()
            .gap_1p5()
            .when(opcional, |row| {
                let cb = on_elegir.clone();
                row.child(
                    Button::new((id_prefijo, u64::MAX))
                        .xsmall()
                        .label("Sin color")
                        .when(sin_color, |b| b.primary())
                        .when(!sin_color, |b| b.outline())
                        .on_click(move |_, w, cx| cb(None, w, cx)),
                )
            })
            .children(COLORES_ACENTO.into_iter().enumerate().map(|(ix, hex)| {
                let activo = actual.as_deref() == Some(hex.to_ascii_lowercase().as_str());
                let color = parsear_color_hex(Some(hex)).unwrap_or_else(|| rgb(0x6366f1));
                let cb = on_elegir.clone();
                div()
                    .id((id_prefijo, ix as u64))
                    .size_6()
                    .rounded_full()
                    .bg(color)
                    .flex()
                    .items_center()
                    .justify_center()
                    .when(activo, |d| d.border_2().border_color(cx.theme().foreground))
                    .when(activo, |d| {
                        d.child(
                            Icon::new(IconName::Check)
                                .xsmall()
                                .text_color(gpui_kit::white()),
                        )
                    })
                    .on_click(move |_, w, cx| cb(Some(hex.to_string()), w, cx))
            })),
    )
}

fn pie_dialogo(
    id_cancelar: &'static str,
    id_ok: &'static str,
    etiqueta_ok: &'static str,
    guardando: bool,
    deshabilitado: bool,
    on_ok: impl Fn(&mut Window, &mut App) + 'static,
) -> DialogFooter {
    DialogFooter::new()
        .child(
            Button::new(id_cancelar)
                .outline()
                .label("Cancelar")
                .disabled(guardando)
                .on_click(|_, w, cx| w.close_dialog(cx)),
        )
        .child(
            Button::new(id_ok)
                .primary()
                .label(etiqueta_ok)
                .loading(guardando)
                .disabled(guardando || deshabilitado)
                .on_click(move |_, w, cx| on_ok(w, cx)),
        )
}

// ---------------------------------------------------------------------------
// Organización (crear / editar)
// ---------------------------------------------------------------------------

struct FormOrganizacion {
    existente_id: Option<i64>,
    nombre: Entity<InputState>,
    descripcion: Entity<TextareaState>,
    color: String,
    guardando: bool,
    error: Option<SharedString>,
    vista: WeakEntity<OrganizacionesView>,
}

impl FormOrganizacion {
    fn new(
        existente: Option<&Organizacion>,
        vista: WeakEntity<OrganizacionesView>,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) -> Self {
        let nombre_val = existente.map(|o| o.nombre.clone()).unwrap_or_default();
        let desc_val = existente.map(|o| o.descripcion.clone()).unwrap_or_default();
        let color = existente
            .and_then(|o| o.color.clone())
            .filter(|c| !c.is_empty())
            .unwrap_or_else(|| COLORES_ACENTO[0].to_string());

        let nombre = cx.new(|cx| {
            let mut s = InputState::new(window, cx).placeholder("Ej. Acme S.L.");
            if !nombre_val.is_empty() {
                s.set_value(nombre_val, window, cx);
            }
            s
        });
        let descripcion = cx.new(|cx| {
            let mut s = TextareaState::new(window, cx)
                .soft_wrap(true)
                .placeholder("¿A qué se dedica la organización?");
            if !desc_val.is_empty() {
                s.set_value(desc_val, window, cx);
            }
            s
        });
        Self {
            existente_id: existente.map(|o| o.id),
            nombre,
            descripcion,
            color,
            guardando: false,
            error: None,
            vista,
        }
    }

    fn enviar(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        if self.guardando {
            return;
        }
        let nombre = self.nombre.read(cx).value().trim().to_string();
        let descripcion = self.descripcion.read(cx).value().trim().to_string();
        if let Err(msg) = validar_nombre_y_desc(&nombre, &descripcion, 100, 500) {
            self.error = Some(msg.into());
            cx.notify();
            return;
        }
        self.error = None;
        self.guardando = true;
        cx.notify();

        let api = crate::api(cx);
        let color = self.color.clone();
        let existente_id = self.existente_id;
        let vista = self.vista.clone();
        let cuerpo = json!({
            "nombre": nombre,
            "descripcion": descripcion,
            "color": color,
        });

        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(async move {
                    match existente_id {
                        None => api.post::<Organizacion>("/organizaciones", cuerpo),
                        Some(id) => {
                            api.put::<Organizacion>(&format!("/organizaciones/{id}"), cuerpo)
                        }
                    }
                })
                .await;
            this.update_in(cx, |this, window, cx| {
                this.guardando = false;
                match r {
                    Ok(org) => {
                        let msg = if existente_id.is_none() {
                            "Organización creada."
                        } else {
                            "Organización actualizada."
                        };
                        window.push_notification(Notification::success(msg), cx);
                        window.close_dialog(cx);
                        vista
                            .update(cx, |v, cx| {
                                v.seleccionar_y_cargar(org.id, window, cx);
                            })
                            .ok();
                    }
                    Err(e) => {
                        this.error = Some(e.mensaje.into());
                        cx.notify();
                    }
                }
            })
            .ok();
        })
        .detach();
    }
}

impl Render for FormOrganizacion {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let entidad = cx.entity().downgrade();
        v_flex()
            .gap_3()
            .when_some(self.error.clone(), |d, e| {
                d.child(Alert::error("err-form-org", e))
            })
            .child(
                v_flex()
                    .gap_1()
                    .child(campo_etiqueta("Nombre", cx))
                    .child(Input::new(&self.nombre).disabled(self.guardando)),
            )
            .child(
                v_flex()
                    .gap_1()
                    .child(campo_etiqueta("Descripción (opcional)", cx))
                    .child(
                        Textarea::new(&self.descripcion)
                            .h(px(84.))
                            .disabled(self.guardando),
                    ),
            )
            .child(render_selector_color(
                "color-org",
                Some(&self.color),
                false,
                move |hex, _, cx| {
                    if let Some(c) = hex {
                        entidad
                            .update(cx, |f, cx| {
                                f.color = c;
                                cx.notify();
                            })
                            .ok();
                    }
                },
                cx,
            ))
    }
}

pub fn abrir_dialogo_organizacion(
    existente: Option<Organizacion>,
    vista: WeakEntity<OrganizacionesView>,
    window: &mut Window,
    cx: &mut App,
) {
    let es_edicion = existente.is_some();
    let form = cx.new(|cx| FormOrganizacion::new(existente.as_ref(), vista, window, cx));
    let foco_inicial = Cell::new(true);
    window.open_dialog(cx, move |dialog, window, cx| {
        if foco_inicial.replace(false) {
            form.read(cx)
                .nombre
                .read(cx)
                .focus_handle(cx)
                .focus(window, cx);
        }
        let guardando = form.read(cx).guardando;
        let f_ok = form.clone();
        dialog
            .title(if es_edicion {
                "Editar organización"
            } else {
                "Nueva organización"
            })
            .w(px(460.))
            .child(form.clone())
            .footer(pie_dialogo(
                "cancelar-org",
                "guardar-org",
                if es_edicion { "Guardar" } else { "Crear" },
                guardando,
                false,
                move |w, cx| f_ok.update(cx, |f, cx| f.enviar(w, cx)),
            ))
    });
}

// ---------------------------------------------------------------------------
// Proyecto (crear / editar)
// ---------------------------------------------------------------------------

struct FormProyecto {
    org_id: i64,
    existente_id: Option<i64>,
    nombre: Entity<InputState>,
    descripcion: Entity<TextareaState>,
    estado: EstadoProyecto,
    fecha_inicio: Entity<InputState>,
    fecha_fin: Entity<InputState>,
    color: Option<String>,
    equipos: Vec<Equipo>,
    miembros: Vec<MiembroOrganizacion>,
    equipo_ids: Vec<i64>,
    integrante_ids: Vec<i64>,
    guardando: bool,
    error: Option<SharedString>,
    vista: WeakEntity<OrganizacionesView>,
}

impl FormProyecto {
    fn new(
        org_id: i64,
        existente: Option<&Proyecto>,
        equipos: Vec<Equipo>,
        miembros: Vec<MiembroOrganizacion>,
        vista: WeakEntity<OrganizacionesView>,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) -> Self {
        let nombre = cx.new(|cx| {
            let mut s = InputState::new(window, cx).placeholder("Ej. Lanzamiento de la web");
            if let Some(p) = existente {
                s.set_value(p.nombre.clone(), window, cx);
            }
            s
        });
        let descripcion = cx.new(|cx| {
            let mut s = TextareaState::new(window, cx)
                .soft_wrap(true)
                .placeholder("¿De qué trata el proyecto?");
            if let Some(p) = existente
                && !p.descripcion.is_empty()
            {
                s.set_value(p.descripcion.clone(), window, cx);
            }
            s
        });
        let fecha_inicio = cx.new(|cx| {
            let mut s = InputState::new(window, cx).placeholder("AAAA-MM-DD");
            if let Some(f) = existente.and_then(|p| p.fecha_inicio.clone()) {
                s.set_value(f, window, cx);
            }
            s
        });
        let fecha_fin = cx.new(|cx| {
            let mut s = InputState::new(window, cx).placeholder("AAAA-MM-DD");
            if let Some(f) = existente.and_then(|p| p.fecha_fin.clone()) {
                s.set_value(f, window, cx);
            }
            s
        });
        Self {
            org_id,
            existente_id: existente.map(|p| p.id),
            nombre,
            descripcion,
            estado: existente
                .map(|p| p.estado)
                .unwrap_or(EstadoProyecto::Activo),
            fecha_inicio,
            fecha_fin,
            color: existente
                .and_then(|p| p.color.clone())
                .filter(|c| !c.is_empty()),
            equipos,
            miembros,
            equipo_ids: existente.map(|p| p.equipo_ids.clone()).unwrap_or_default(),
            integrante_ids: existente
                .map(|p| p.integrante_ids.clone())
                .unwrap_or_default(),
            guardando: false,
            error: None,
            vista,
        }
    }

    fn alternar_equipo(&mut self, id: i64, marcado: bool, cx: &mut Context<Self>) {
        if marcado {
            if !self.equipo_ids.contains(&id) {
                self.equipo_ids.push(id);
            }
        } else {
            self.equipo_ids.retain(|&x| x != id);
        }
        cx.notify();
    }

    fn alternar_integrante(&mut self, id: i64, marcado: bool, cx: &mut Context<Self>) {
        if marcado {
            if !self.integrante_ids.contains(&id) {
                self.integrante_ids.push(id);
            }
        } else {
            self.integrante_ids.retain(|&x| x != id);
        }
        cx.notify();
    }

    fn enviar(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        if self.guardando {
            return;
        }
        let nombre = self.nombre.read(cx).value().trim().to_string();
        let descripcion = self.descripcion.read(cx).value().trim().to_string();
        let inicio_raw = self.fecha_inicio.read(cx).value().trim().to_string();
        let fin_raw = self.fecha_fin.read(cx).value().trim().to_string();
        let fecha_inicio = (!inicio_raw.is_empty()).then_some(inicio_raw);
        let fecha_fin = (!fin_raw.is_empty()).then_some(fin_raw);

        if let Err(msg) = validar_proyecto(
            &nombre,
            &descripcion,
            fecha_inicio.as_deref(),
            fecha_fin.as_deref(),
            &self.equipo_ids,
            &self.integrante_ids,
        ) {
            self.error = Some(msg.into());
            cx.notify();
            return;
        }
        self.error = None;
        self.guardando = true;
        cx.notify();

        let api = crate::api(cx);
        let org_id = self.org_id;
        let existente_id = self.existente_id;
        let vista = self.vista.clone();
        let cuerpo = json!({
            "nombre": nombre,
            "descripcion": descripcion,
            "estado": self.estado.api(),
            "color": self.color,
            "fechaInicio": fecha_inicio,
            "fechaFin": fecha_fin,
            "equipoIds": self.equipo_ids,
            "integranteIds": self.integrante_ids,
        });

        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(async move {
                    match existente_id {
                        None => api.post::<Proyecto>(
                            &format!("/organizaciones/{org_id}/proyectos"),
                            cuerpo,
                        ),
                        Some(pid) => api.put::<Proyecto>(
                            &format!("/organizaciones/{org_id}/proyectos/{pid}"),
                            cuerpo,
                        ),
                    }
                })
                .await;
            this.update_in(cx, |this, window, cx| {
                this.guardando = false;
                match r {
                    Ok(_) => {
                        let msg = if existente_id.is_none() {
                            "Proyecto creado."
                        } else {
                            "Proyecto actualizado."
                        };
                        window.push_notification(Notification::success(msg), cx);
                        window.close_dialog(cx);
                        vista.update(cx, |v, cx| v.cargar_detalle(window, cx)).ok();
                    }
                    Err(e) => {
                        this.error = Some(e.mensaje.into());
                        cx.notify();
                    }
                }
            })
            .ok();
        })
        .detach();
    }
}

impl Render for FormProyecto {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let entidad = cx.entity().downgrade();
        v_flex()
            .gap_3()
            .when_some(self.error.clone(), |d, e| {
                d.child(Alert::error("err-form-proyecto", e))
            })
            .child(
                v_flex()
                    .gap_1()
                    .child(campo_etiqueta("Nombre", cx))
                    .child(Input::new(&self.nombre).disabled(self.guardando)),
            )
            .child(
                v_flex()
                    .gap_1()
                    .child(campo_etiqueta("Descripción (opcional)", cx))
                    .child(
                        Textarea::new(&self.descripcion)
                            .h(px(72.))
                            .disabled(self.guardando),
                    ),
            )
            .child(
                v_flex().gap_1().child(campo_etiqueta("Estado", cx)).child(
                    h_flex()
                        .gap_1p5()
                        .children(EstadoProyecto::TODOS.map(|est| {
                            let sel = self.estado == est;
                            Button::new(("est-proy", est as u64))
                                .small()
                                .label(est.etiqueta())
                                .when(sel, |b| b.primary())
                                .when(!sel, |b| b.outline())
                                .disabled(self.guardando)
                                .on_click(cx.listener(move |this, _, _, cx| {
                                    this.estado = est;
                                    cx.notify();
                                }))
                        })),
                ),
            )
            .child(
                h_flex()
                    .gap_3()
                    .child(
                        v_flex()
                            .flex_1()
                            .gap_1()
                            .child(campo_etiqueta("Inicio (opcional)", cx))
                            .child(
                                Input::new(&self.fecha_inicio)
                                    .small()
                                    .cleanable(true)
                                    .disabled(self.guardando),
                            ),
                    )
                    .child(
                        v_flex()
                            .flex_1()
                            .gap_1()
                            .child(campo_etiqueta("Fin (opcional)", cx))
                            .child(
                                Input::new(&self.fecha_fin)
                                    .small()
                                    .cleanable(true)
                                    .disabled(self.guardando),
                            ),
                    ),
            )
            .child(render_selector_color(
                "color-proy",
                self.color.as_deref(),
                true,
                move |hex, _, cx| {
                    entidad
                        .update(cx, |f, cx| {
                            f.color = hex;
                            cx.notify();
                        })
                        .ok();
                },
                cx,
            ))
            .child(
                v_flex()
                    .gap_1p5()
                    .child(campo_etiqueta("Equipos", cx))
                    .map(|d| {
                        if self.equipos.is_empty() {
                            d.child(
                                div()
                                    .text_xs()
                                    .text_color(cx.theme().muted_foreground)
                                    .child("La organización aún no tiene equipos."),
                            )
                        } else {
                            d.children(self.equipos.iter().map(|eq| {
                                let id = eq.id;
                                Checkbox::new(("proy-eq", id as u64))
                                    .label(eq.nombre.clone())
                                    .checked(self.equipo_ids.contains(&id))
                                    .disabled(self.guardando)
                                    .on_click(cx.listener(move |this, v: &bool, _, cx| {
                                        this.alternar_equipo(id, *v, cx);
                                    }))
                            }))
                        }
                    }),
            )
            .child(
                v_flex()
                    .gap_1p5()
                    .child(campo_etiqueta("Personas sueltas", cx))
                    .children(self.miembros.iter().map(|m| {
                        let uid = m.usuario_id;
                        Checkbox::new(("proy-miembro", uid as u64))
                            .label(format!("{} ({})", m.nombre, m.email))
                            .checked(self.integrante_ids.contains(&uid))
                            .disabled(self.guardando)
                            .on_click(cx.listener(move |this, v: &bool, _, cx| {
                                this.alternar_integrante(uid, *v, cx);
                            }))
                    })),
            )
    }
}

pub fn abrir_dialogo_proyecto(
    org_id: i64,
    existente: Option<Proyecto>,
    equipos: Vec<Equipo>,
    miembros: Vec<MiembroOrganizacion>,
    vista: WeakEntity<OrganizacionesView>,
    window: &mut Window,
    cx: &mut App,
) {
    let es_edicion = existente.is_some();
    let form = cx.new(|cx| {
        FormProyecto::new(
            org_id,
            existente.as_ref(),
            equipos,
            miembros,
            vista,
            window,
            cx,
        )
    });
    let foco_inicial = Cell::new(true);
    window.open_dialog(cx, move |dialog, window, cx| {
        if foco_inicial.replace(false) {
            form.read(cx)
                .nombre
                .read(cx)
                .focus_handle(cx)
                .focus(window, cx);
        }
        let guardando = form.read(cx).guardando;
        let f_ok = form.clone();
        dialog
            .title(if es_edicion {
                "Editar proyecto"
            } else {
                "Nuevo proyecto"
            })
            .w(px(540.))
            .child(form.clone())
            .footer(pie_dialogo(
                "cancelar-proyecto",
                "guardar-proyecto",
                if es_edicion { "Guardar" } else { "Crear" },
                guardando,
                false,
                move |w, cx| f_ok.update(cx, |f, cx| f.enviar(w, cx)),
            ))
    });
}

// ---------------------------------------------------------------------------
// Equipo (crear / editar)
// ---------------------------------------------------------------------------

struct FormEquipo {
    org_id: i64,
    existente_id: Option<i64>,
    nombre: Entity<InputState>,
    descripcion: Entity<TextareaState>,
    color: String,
    miembros: Vec<MiembroOrganizacion>,
    tags: Vec<Tag>,
    miembro_ids: Vec<i64>,
    lider_id: Option<i64>,
    tag_ids: Vec<i64>,
    guardando: bool,
    error: Option<SharedString>,
    vista: WeakEntity<OrganizacionesView>,
}

impl FormEquipo {
    fn new(
        org_id: i64,
        existente: Option<&Equipo>,
        miembros: Vec<MiembroOrganizacion>,
        tags: Vec<Tag>,
        vista: WeakEntity<OrganizacionesView>,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) -> Self {
        let nombre = cx.new(|cx| {
            let mut s = InputState::new(window, cx).placeholder("Ej. Diseño, Backend, Ventas");
            if let Some(e) = existente {
                s.set_value(e.nombre.clone(), window, cx);
            }
            s
        });
        let descripcion = cx.new(|cx| {
            let mut s = TextareaState::new(window, cx)
                .soft_wrap(true)
                .placeholder("¿De qué se encarga el equipo?");
            if let Some(e) = existente
                && !e.descripcion.is_empty()
            {
                s.set_value(e.descripcion.clone(), window, cx);
            }
            s
        });
        let color = existente
            .and_then(|e| e.color.clone())
            .filter(|c| !c.is_empty())
            .unwrap_or_else(|| COLORES_ACENTO[0].to_string());
        let miembro_ids = existente
            .map(|e| e.miembros.iter().map(|m| m.usuario_id).collect())
            .unwrap_or_default();
        Self {
            org_id,
            existente_id: existente.map(|e| e.id),
            nombre,
            descripcion,
            color,
            miembros,
            tags,
            miembro_ids,
            lider_id: existente.and_then(|e| e.lider_id),
            tag_ids: existente.map(|e| e.tag_ids.clone()).unwrap_or_default(),
            guardando: false,
            error: None,
            vista,
        }
    }

    fn alternar_miembro(&mut self, uid: i64, marcado: bool, cx: &mut Context<Self>) {
        if marcado {
            if !self.miembro_ids.contains(&uid) {
                self.miembro_ids.push(uid);
            }
        } else {
            self.miembro_ids.retain(|&x| x != uid);
            if self.lider_id == Some(uid) {
                self.lider_id = None;
            }
        }
        cx.notify();
    }

    fn alternar_tag(&mut self, tid: i64, cx: &mut Context<Self>) {
        if let Some(pos) = self.tag_ids.iter().position(|&x| x == tid) {
            self.tag_ids.remove(pos);
        } else {
            self.tag_ids.push(tid);
        }
        cx.notify();
    }

    fn enviar(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        if self.guardando {
            return;
        }
        let nombre = self.nombre.read(cx).value().trim().to_string();
        let descripcion = self.descripcion.read(cx).value().trim().to_string();
        if let Err(msg) = validar_equipo(&nombre, &descripcion, &self.miembro_ids) {
            self.error = Some(msg.into());
            cx.notify();
            return;
        }
        let lider_final = self.lider_id.filter(|id| self.miembro_ids.contains(id));

        self.error = None;
        self.guardando = true;
        cx.notify();

        let api = crate::api(cx);
        let org_id = self.org_id;
        let existente_id = self.existente_id;
        let vista = self.vista.clone();
        let cuerpo = json!({
            "nombre": nombre,
            "descripcion": descripcion,
            "color": self.color,
            "miembroIds": self.miembro_ids,
            "liderId": lider_final,
            "tagIds": self.tag_ids,
        });

        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(async move {
                    match existente_id {
                        None => {
                            api.post::<Equipo>(&format!("/organizaciones/{org_id}/equipos"), cuerpo)
                        }
                        Some(eid) => api.put::<Equipo>(
                            &format!("/organizaciones/{org_id}/equipos/{eid}"),
                            cuerpo,
                        ),
                    }
                })
                .await;
            this.update_in(cx, |this, window, cx| {
                this.guardando = false;
                match r {
                    Ok(_) => {
                        let msg = if existente_id.is_none() {
                            "Equipo creado."
                        } else {
                            "Equipo actualizado."
                        };
                        window.push_notification(Notification::success(msg), cx);
                        window.close_dialog(cx);
                        vista.update(cx, |v, cx| v.cargar_detalle(window, cx)).ok();
                    }
                    Err(e) => {
                        this.error = Some(e.mensaje.into());
                        cx.notify();
                    }
                }
            })
            .ok();
        })
        .detach();
    }
}

impl Render for FormEquipo {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let entidad = cx.entity().downgrade();
        let elegidos: Vec<&MiembroOrganizacion> = self
            .miembros
            .iter()
            .filter(|m| self.miembro_ids.contains(&m.usuario_id))
            .collect();

        v_flex()
            .gap_3()
            .when_some(self.error.clone(), |d, e| {
                d.child(Alert::error("err-form-equipo", e))
            })
            .child(
                v_flex()
                    .gap_1()
                    .child(campo_etiqueta("Nombre", cx))
                    .child(Input::new(&self.nombre).disabled(self.guardando)),
            )
            .child(
                v_flex()
                    .gap_1()
                    .child(campo_etiqueta("Descripción (opcional)", cx))
                    .child(
                        Textarea::new(&self.descripcion)
                            .h(px(72.))
                            .disabled(self.guardando),
                    ),
            )
            .child(render_selector_color(
                "color-eq",
                Some(&self.color),
                false,
                move |hex, _, cx| {
                    if let Some(c) = hex {
                        entidad
                            .update(cx, |f, cx| {
                                f.color = c;
                                cx.notify();
                            })
                            .ok();
                    }
                },
                cx,
            ))
            .child(
                v_flex()
                    .gap_1p5()
                    .child(campo_etiqueta("Miembros (al menos 2)", cx))
                    .children(self.miembros.iter().map(|m| {
                        let uid = m.usuario_id;
                        Checkbox::new(("eq-miembro", uid as u64))
                            .label(format!("{} ({})", m.nombre, m.email))
                            .checked(self.miembro_ids.contains(&uid))
                            .disabled(self.guardando)
                            .on_click(cx.listener(move |this, v: &bool, _, cx| {
                                this.alternar_miembro(uid, *v, cx);
                            }))
                    })),
            )
            .child(
                v_flex()
                    .gap_1p5()
                    .child(campo_etiqueta("Líder (opcional)", cx))
                    .child(
                        h_flex()
                            .flex_wrap()
                            .gap_1p5()
                            .child(
                                Button::new("eq-sin-lider")
                                    .xsmall()
                                    .label("Sin líder")
                                    .when(self.lider_id.is_none(), |b| b.primary())
                                    .when(self.lider_id.is_some(), |b| b.outline())
                                    .disabled(self.guardando)
                                    .on_click(cx.listener(|this, _, _, cx| {
                                        this.lider_id = None;
                                        cx.notify();
                                    })),
                            )
                            .children(elegidos.into_iter().map(|m| {
                                let uid = m.usuario_id;
                                let sel = self.lider_id == Some(uid);
                                Button::new(("eq-lider", uid as u64))
                                    .xsmall()
                                    .label(m.nombre.clone())
                                    .when(sel, |b| b.primary())
                                    .when(!sel, |b| b.outline())
                                    .disabled(self.guardando)
                                    .on_click(cx.listener(move |this, _, _, cx| {
                                        this.lider_id = Some(uid);
                                        cx.notify();
                                    }))
                            })),
                    ),
            )
            .when(!self.tags.is_empty(), |d| {
                d.child(
                    v_flex().gap_1p5().child(campo_etiqueta("Tags", cx)).child(
                        h_flex()
                            .flex_wrap()
                            .gap_1p5()
                            .children(self.tags.iter().map(|t| {
                                let tid = t.id;
                                let sel = self.tag_ids.contains(&tid);
                                Button::new(("eq-tag", tid as u64))
                                    .xsmall()
                                    .label(t.nombre.clone())
                                    .when(sel, |b| b.primary())
                                    .when(!sel, |b| b.outline())
                                    .disabled(self.guardando)
                                    .on_click(cx.listener(move |this, _, _, cx| {
                                        this.alternar_tag(tid, cx);
                                    }))
                            })),
                    ),
                )
            })
    }
}

pub fn abrir_dialogo_equipo(
    org_id: i64,
    existente: Option<Equipo>,
    miembros: Vec<MiembroOrganizacion>,
    tags: Vec<Tag>,
    vista: WeakEntity<OrganizacionesView>,
    window: &mut Window,
    cx: &mut App,
) {
    let es_edicion = existente.is_some();
    let form = cx.new(|cx| {
        FormEquipo::new(
            org_id,
            existente.as_ref(),
            miembros,
            tags,
            vista,
            window,
            cx,
        )
    });
    let foco_inicial = Cell::new(true);
    window.open_dialog(cx, move |dialog, window, cx| {
        if foco_inicial.replace(false) {
            form.read(cx)
                .nombre
                .read(cx)
                .focus_handle(cx)
                .focus(window, cx);
        }
        let guardando = form.read(cx).guardando;
        let f_ok = form.clone();
        dialog
            .title(if es_edicion {
                "Editar equipo"
            } else {
                "Nuevo equipo"
            })
            .w(px(540.))
            .child(form.clone())
            .footer(pie_dialogo(
                "cancelar-equipo",
                "guardar-equipo",
                if es_edicion { "Guardar" } else { "Crear" },
                guardando,
                false,
                move |w, cx| f_ok.update(cx, |f, cx| f.enviar(w, cx)),
            ))
    });
}

// ---------------------------------------------------------------------------
// Delegados de un equipo
// ---------------------------------------------------------------------------

struct FormDelegados {
    org_id: i64,
    equipo_id: i64,
    candidatos: Vec<(i64, String, String)>,
    seleccionados: Vec<i64>,
    guardando: bool,
    error: Option<SharedString>,
    vista: WeakEntity<OrganizacionesView>,
}

impl FormDelegados {
    fn new(
        org_id: i64,
        equipo: &Equipo,
        miembros: &[MiembroOrganizacion],
        vista: WeakEntity<OrganizacionesView>,
    ) -> Self {
        let mut candidatos = Vec::new();
        let mut seleccionados = Vec::new();
        for me in &equipo.miembros {
            if Some(me.usuario_id) == equipo.lider_id {
                continue;
            }
            let (nombre, email) = miembros
                .iter()
                .find(|m| m.usuario_id == me.usuario_id)
                .map(|m| (m.nombre.clone(), m.email.clone()))
                .unwrap_or_else(|| (format!("Usuario #{}", me.usuario_id), String::new()));
            candidatos.push((me.usuario_id, nombre, email));
            if me.puede_crear_tareas {
                seleccionados.push(me.usuario_id);
            }
        }
        Self {
            org_id,
            equipo_id: equipo.id,
            candidatos,
            seleccionados,
            guardando: false,
            error: None,
            vista,
        }
    }

    fn enviar(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        if self.guardando {
            return;
        }
        self.guardando = true;
        self.error = None;
        cx.notify();

        let api = crate::api(cx);
        let org_id = self.org_id;
        let equipo_id = self.equipo_id;
        let cuerpo = json!({ "usuarioIds": self.seleccionados });
        let vista = self.vista.clone();

        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(async move {
                    api.put::<Equipo>(
                        &format!("/organizaciones/{org_id}/equipos/{equipo_id}/delegados"),
                        cuerpo,
                    )
                })
                .await;
            this.update_in(cx, |this, window, cx| {
                this.guardando = false;
                match r {
                    Ok(_) => {
                        window.push_notification(
                            Notification::success("Delegados actualizados."),
                            cx,
                        );
                        window.close_dialog(cx);
                        vista.update(cx, |v, cx| v.cargar_detalle(window, cx)).ok();
                    }
                    Err(e) => {
                        this.error = Some(e.mensaje.into());
                        cx.notify();
                    }
                }
            })
            .ok();
        })
        .detach();
    }
}

impl Render for FormDelegados {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        v_flex()
            .gap_3()
            .child(
                div()
                    .text_sm()
                    .text_color(cx.theme().muted_foreground)
                    .child("Elige qué miembros pueden crear tareas además del líder."),
            )
            .when_some(self.error.clone(), |d, e| {
                d.child(Alert::error("err-delegados", e))
            })
            .map(|d| {
                if self.candidatos.is_empty() {
                    d.child(
                        div()
                            .text_sm()
                            .text_color(cx.theme().muted_foreground)
                            .child("No hay otros integrantes en este equipo."),
                    )
                } else {
                    d.children(self.candidatos.iter().map(|(uid, nombre, email)| {
                        let id = *uid;
                        let etiqueta = if email.is_empty() {
                            nombre.clone()
                        } else {
                            format!("{nombre} ({email})")
                        };
                        Checkbox::new(("del-eq", id as u64))
                            .label(etiqueta)
                            .checked(self.seleccionados.contains(&id))
                            .disabled(self.guardando)
                            .on_click(cx.listener(move |this, marcado: &bool, _, cx| {
                                if *marcado {
                                    if !this.seleccionados.contains(&id) {
                                        this.seleccionados.push(id);
                                    }
                                } else {
                                    this.seleccionados.retain(|&x| x != id);
                                }
                                cx.notify();
                            }))
                    }))
                }
            })
    }
}

pub fn abrir_dialogo_delegados(
    org_id: i64,
    equipo: &Equipo,
    miembros: &[MiembroOrganizacion],
    vista: WeakEntity<OrganizacionesView>,
    window: &mut Window,
    cx: &mut App,
) {
    let form = cx.new(|_| FormDelegados::new(org_id, equipo, miembros, vista));
    window.open_dialog(cx, move |dialog, _, cx| {
        let guardando = form.read(cx).guardando;
        let f_ok = form.clone();
        dialog
            .title("Delegados del equipo")
            .w(px(460.))
            .child(form.clone())
            .footer(pie_dialogo(
                "cancelar-delegados",
                "guardar-delegados",
                "Guardar",
                guardando,
                false,
                move |w, cx| f_ok.update(cx, |f, cx| f.enviar(w, cx)),
            ))
    });
}

// ---------------------------------------------------------------------------
// Asignar roles a un miembro
// ---------------------------------------------------------------------------

struct FormAsignarRoles {
    org_id: i64,
    usuario_id: i64,
    roles: Vec<RolOrganizacion>,
    seleccionados: Vec<i64>,
    guardando: bool,
    error: Option<SharedString>,
    vista: WeakEntity<OrganizacionesView>,
}

impl FormAsignarRoles {
    fn new(
        org_id: i64,
        miembro: &MiembroOrganizacion,
        roles: Vec<RolOrganizacion>,
        vista: WeakEntity<OrganizacionesView>,
    ) -> Self {
        let seleccionados = miembro.roles.iter().map(|r| r.id).collect();
        Self {
            org_id,
            usuario_id: miembro.usuario_id,
            roles,
            seleccionados,
            guardando: false,
            error: None,
            vista,
        }
    }

    fn enviar(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        if self.guardando || self.roles.is_empty() {
            return;
        }
        self.guardando = true;
        self.error = None;
        cx.notify();

        let api = crate::api(cx);
        let org_id = self.org_id;
        let uid = self.usuario_id;
        let cuerpo = json!({ "rolIds": self.seleccionados });
        let vista = self.vista.clone();

        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(async move {
                    api.put::<serde_json::Value>(
                        &format!("/organizaciones/{org_id}/miembros/{uid}/roles"),
                        cuerpo,
                    )
                })
                .await;
            this.update_in(cx, |this, window, cx| {
                this.guardando = false;
                match r {
                    Ok(_) => {
                        window.push_notification(Notification::success("Roles actualizados."), cx);
                        window.close_dialog(cx);
                        vista.update(cx, |v, cx| v.cargar_detalle(window, cx)).ok();
                    }
                    Err(e) => {
                        this.error = Some(e.mensaje.into());
                        cx.notify();
                    }
                }
            })
            .ok();
        })
        .detach();
    }
}

impl Render for FormAsignarRoles {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        v_flex()
            .gap_3()
            .when_some(self.error.clone(), |d, e| {
                d.child(Alert::error("err-asignar-roles", e))
            })
            .map(|d| {
                if self.roles.is_empty() {
                    d.child(
                        div()
                            .text_sm()
                            .text_color(cx.theme().muted_foreground)
                            .child("Aún no hay roles en la organización. Crea uno en la pestaña Roles."),
                    )
                } else {
                    d.children(self.roles.iter().map(|rol| {
                        let rid = rol.id;
                        let n = rol.permisos.len();
                        let sufijo = if n == 1 { "permiso" } else { "permisos" };
                        Checkbox::new(("asig-rol", rid as u64))
                            .label(format!("{} · {n} {sufijo}", rol.nombre))
                            .checked(self.seleccionados.contains(&rid))
                            .disabled(self.guardando)
                            .on_click(cx.listener(move |this, marcado: &bool, _, cx| {
                                if *marcado {
                                    if !this.seleccionados.contains(&rid) {
                                        this.seleccionados.push(rid);
                                    }
                                } else {
                                    this.seleccionados.retain(|&x| x != rid);
                                }
                                cx.notify();
                            }))
                    }))
                }
            })
    }
}

pub fn abrir_dialogo_asignar_roles(
    org_id: i64,
    miembro: &MiembroOrganizacion,
    roles: Vec<RolOrganizacion>,
    vista: WeakEntity<OrganizacionesView>,
    window: &mut Window,
    cx: &mut App,
) {
    let titulo = format!("Roles de {}", miembro.nombre);
    let sin_roles = roles.is_empty();
    let form = cx.new(|_| FormAsignarRoles::new(org_id, miembro, roles, vista));
    window.open_dialog(cx, move |dialog, _, cx| {
        let guardando = form.read(cx).guardando;
        let f_ok = form.clone();
        dialog
            .title(titulo.clone())
            .w(px(460.))
            .child(form.clone())
            .footer(pie_dialogo(
                "cancelar-asig-roles",
                "guardar-asig-roles",
                "Guardar",
                guardando,
                sin_roles,
                move |w, cx| f_ok.update(cx, |f, cx| f.enviar(w, cx)),
            ))
    });
}

// ---------------------------------------------------------------------------
// Rol de organización (crear / editar)
// ---------------------------------------------------------------------------

struct FormRol {
    org_id: i64,
    existente_id: Option<i64>,
    nombre: Entity<InputState>,
    catalogo: CatalogoPermisosOrganizacion,
    permisos: Vec<String>,
    plantilla_elegida: Option<String>,
    guardando: bool,
    error: Option<SharedString>,
    vista: WeakEntity<OrganizacionesView>,
}

impl FormRol {
    fn new(
        org_id: i64,
        existente: Option<&RolOrganizacion>,
        catalogo: CatalogoPermisosOrganizacion,
        vista: WeakEntity<OrganizacionesView>,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) -> Self {
        let nombre = cx.new(|cx| {
            let mut s = InputState::new(window, cx).placeholder("Ej. Coordinación");
            if let Some(r) = existente {
                s.set_value(r.nombre.clone(), window, cx);
            }
            s
        });
        Self {
            org_id,
            existente_id: existente.map(|r| r.id),
            nombre,
            catalogo,
            permisos: existente.map(|r| r.permisos.clone()).unwrap_or_default(),
            plantilla_elegida: None,
            guardando: false,
            error: None,
            vista,
        }
    }

    fn aplicar_plantilla(
        &mut self,
        nombre_plantilla: Option<String>,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        self.plantilla_elegida = nombre_plantilla.clone();
        if let Some(np) = nombre_plantilla
            && let Some(p) = self.catalogo.plantillas.iter().find(|x| x.nombre == np)
        {
            let nombre_p = p.nombre.clone();
            self.permisos = p.permisos.clone();
            self.nombre
                .update(cx, |s, cx| s.set_value(nombre_p, window, cx));
        }
        cx.notify();
    }

    fn enviar(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        if self.guardando {
            return;
        }
        let nombre = self.nombre.read(cx).value().trim().to_string();
        if let Err(msg) = validar_nombre_y_desc(&nombre, "", 64, 500) {
            self.error = Some(msg.into());
            cx.notify();
            return;
        }
        self.error = None;
        self.guardando = true;
        cx.notify();

        let api = crate::api(cx);
        let org_id = self.org_id;
        let existente_id = self.existente_id;
        let vista = self.vista.clone();
        let cuerpo = json!({
            "nombre": nombre,
            "permisos": self.permisos,
        });

        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(async move {
                    match existente_id {
                        None => api.post::<RolOrganizacion>(
                            &format!("/organizaciones/{org_id}/roles"),
                            cuerpo,
                        ),
                        Some(rid) => api.put::<RolOrganizacion>(
                            &format!("/organizaciones/{org_id}/roles/{rid}"),
                            cuerpo,
                        ),
                    }
                })
                .await;
            this.update_in(cx, |this, window, cx| {
                this.guardando = false;
                match r {
                    Ok(_) => {
                        let msg = if existente_id.is_none() {
                            "Rol creado."
                        } else {
                            "Rol actualizado."
                        };
                        window.push_notification(Notification::success(msg), cx);
                        window.close_dialog(cx);
                        vista.update(cx, |v, cx| v.cargar_detalle(window, cx)).ok();
                    }
                    Err(e) => {
                        this.error = Some(e.mensaje.into());
                        cx.notify();
                    }
                }
            })
            .ok();
        })
        .detach();
    }
}

impl Render for FormRol {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let lista_permisos: Vec<String> = if self.catalogo.permisos.is_empty() {
            PERMISOS_POR_DEFECTO
                .iter()
                .map(|s| (*s).to_string())
                .collect()
        } else {
            self.catalogo.permisos.clone()
        };

        v_flex()
            .gap_3()
            .when_some(self.error.clone(), |d, e| {
                d.child(Alert::error("err-form-rol", e))
            })
            .when(
                self.existente_id.is_none() && !self.catalogo.plantillas.is_empty(),
                |d| {
                    d.child(
                        v_flex()
                            .gap_1p5()
                            .child(campo_etiqueta("Partir de una plantilla (opcional)", cx))
                            .child(
                                h_flex()
                                    .flex_wrap()
                                    .gap_1p5()
                                    .child(
                                        Button::new("rol-desde-cero")
                                            .xsmall()
                                            .label("Desde cero")
                                            .when(self.plantilla_elegida.is_none(), |b| b.primary())
                                            .when(self.plantilla_elegida.is_some(), |b| b.outline())
                                            .disabled(self.guardando)
                                            .on_click(cx.listener(|this, _, w, cx| {
                                                this.aplicar_plantilla(None, w, cx);
                                            })),
                                    )
                                    .children(self.catalogo.plantillas.iter().enumerate().map(
                                        |(ix, p)| {
                                            let nombre = p.nombre.clone();
                                            let sel = self.plantilla_elegida.as_deref()
                                                == Some(nombre.as_str());
                                            Button::new(("rol-plantilla", ix as u64))
                                                .xsmall()
                                                .label(nombre.clone())
                                                .when(sel, |b| b.primary())
                                                .when(!sel, |b| b.outline())
                                                .disabled(self.guardando)
                                                .on_click(cx.listener(move |this, _, w, cx| {
                                                    this.aplicar_plantilla(
                                                        Some(nombre.clone()),
                                                        w,
                                                        cx,
                                                    );
                                                }))
                                        },
                                    )),
                            ),
                    )
                },
            )
            .child(
                v_flex()
                    .gap_1()
                    .child(campo_etiqueta("Nombre", cx))
                    .child(Input::new(&self.nombre).disabled(self.guardando)),
            )
            .child(
                v_flex()
                    .gap_1p5()
                    .child(campo_etiqueta("Permisos", cx))
                    .child(
                        div()
                            .text_xs()
                            .text_color(cx.theme().muted_foreground)
                            .child(
                                "Ver la organización no necesita permiso: basta con ser miembro.",
                            ),
                    )
                    .children(lista_permisos.into_iter().enumerate().map(|(ix, permiso)| {
                        let etiqueta = etiqueta_permiso(&permiso).to_string();
                        let marcado = self.permisos.contains(&permiso);
                        Checkbox::new(("rol-perm", ix as u64))
                            .label(etiqueta)
                            .checked(marcado)
                            .disabled(self.guardando)
                            .on_click(cx.listener(move |this, v: &bool, _, cx| {
                                if *v {
                                    if !this.permisos.contains(&permiso) {
                                        this.permisos.push(permiso.clone());
                                    }
                                } else {
                                    this.permisos.retain(|p| p != &permiso);
                                }
                                cx.notify();
                            }))
                    })),
            )
    }
}

pub fn abrir_dialogo_rol(
    org_id: i64,
    existente: Option<RolOrganizacion>,
    catalogo: CatalogoPermisosOrganizacion,
    vista: WeakEntity<OrganizacionesView>,
    window: &mut Window,
    cx: &mut App,
) {
    let es_edicion = existente.is_some();
    let form = cx.new(|cx| FormRol::new(org_id, existente.as_ref(), catalogo, vista, window, cx));
    let foco_inicial = Cell::new(true);
    window.open_dialog(cx, move |dialog, window, cx| {
        if foco_inicial.replace(false) {
            form.read(cx)
                .nombre
                .read(cx)
                .focus_handle(cx)
                .focus(window, cx);
        }
        let guardando = form.read(cx).guardando;
        let f_ok = form.clone();
        dialog
            .title(if es_edicion {
                "Editar rol"
            } else {
                "Nuevo rol"
            })
            .w(px(500.))
            .child(form.clone())
            .footer(pie_dialogo(
                "cancelar-rol",
                "guardar-rol",
                if es_edicion { "Guardar" } else { "Crear" },
                guardando,
                false,
                move |w, cx| f_ok.update(cx, |f, cx| f.enviar(w, cx)),
            ))
    });
}

// ---------------------------------------------------------------------------
// Invitar miembro por email
// ---------------------------------------------------------------------------

struct FormInvitar {
    org_id: i64,
    email: Entity<InputState>,
    guardando: bool,
    error: Option<SharedString>,
    vista: WeakEntity<OrganizacionesView>,
}

impl FormInvitar {
    fn new(
        org_id: i64,
        vista: WeakEntity<OrganizacionesView>,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) -> Self {
        let email = cx.new(|cx| InputState::new(window, cx).placeholder("persona@ejemplo.com"));
        Self {
            org_id,
            email,
            guardando: false,
            error: None,
            vista,
        }
    }

    fn enviar(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        if self.guardando {
            return;
        }
        let email = self.email.read(cx).value().trim().to_string();
        if let Err(msg) = validar_email(&email) {
            self.error = Some(msg.into());
            cx.notify();
            return;
        }
        self.error = None;
        self.guardando = true;
        cx.notify();

        let api = crate::api(cx);
        let org_id = self.org_id;
        let vista = self.vista.clone();
        let cuerpo = json!({ "email": email });

        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(async move {
                    api.post::<serde_json::Value>(
                        &format!("/organizaciones/{org_id}/invitaciones"),
                        cuerpo,
                    )
                })
                .await;
            this.update_in(cx, |this, window, cx| {
                this.guardando = false;
                match r {
                    Ok(_) => {
                        window.push_notification(
                            Notification::success(format!("Invitación enviada a {email}")),
                            cx,
                        );
                        window.close_dialog(cx);
                        vista.update(cx, |v, cx| v.cargar_detalle(window, cx)).ok();
                    }
                    Err(e) => {
                        this.error = Some(e.mensaje.into());
                        cx.notify();
                    }
                }
            })
            .ok();
        })
        .detach();
    }
}

impl Render for FormInvitar {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        v_flex()
            .gap_3()
            .child(
                div()
                    .text_sm()
                    .text_color(cx.theme().muted_foreground)
                    .child("Si el email no tiene cuenta, podrá crearla desde el enlace."),
            )
            .when_some(self.error.clone(), |d, e| {
                d.child(Alert::error("err-invitar", e))
            })
            .child(
                v_flex()
                    .gap_1()
                    .child(campo_etiqueta("Email", cx))
                    .child(Input::new(&self.email).disabled(self.guardando)),
            )
    }
}

pub fn abrir_dialogo_invitar(
    org_id: i64,
    vista: WeakEntity<OrganizacionesView>,
    window: &mut Window,
    cx: &mut App,
) {
    let form = cx.new(|cx| FormInvitar::new(org_id, vista, window, cx));
    let email_entity = form.read(cx).email.clone();
    let f_enter = form.clone();
    let _ = window.subscribe(&email_entity, cx, move |_, e: &InputEvent, window, cx| {
        if matches!(e, InputEvent::PressEnter { .. }) {
            f_enter.update(cx, |f, cx| f.enviar(window, cx));
        }
    });
    let foco_inicial = Cell::new(true);
    window.open_dialog(cx, move |dialog, window, cx| {
        if foco_inicial.replace(false) {
            form.read(cx)
                .email
                .read(cx)
                .focus_handle(cx)
                .focus(window, cx);
        }
        let guardando = form.read(cx).guardando;
        let f_ok = form.clone();
        dialog
            .title("Invitar miembro")
            .w(px(440.))
            .child(form.clone())
            .footer(pie_dialogo(
                "cancelar-invitar",
                "enviar-invitar",
                "Enviar invitación",
                guardando,
                false,
                move |w, cx| f_ok.update(cx, |f, cx| f.enviar(w, cx)),
            ))
    });
}

// ---------------------------------------------------------------------------
// Nueva tarea rápida en proyecto o equipo (`POST /tareas`)
// ---------------------------------------------------------------------------

pub fn abrir_dialogo_nueva_tarea_destino(
    org_id: i64,
    proyecto_id: Option<i64>,
    equipo_id: Option<i64>,
    vista: WeakEntity<OrganizacionesView>,
    window: &mut Window,
    cx: &mut App,
) {
    let titulo = cx.new(|cx| InputState::new(window, cx).placeholder("¿Qué hay que hacer?"));
    let enviar = {
        let titulo = titulo.clone();
        let vista = vista.clone();
        move |window: &mut Window, cx: &mut App| {
            let texto = titulo.read(cx).value().trim().to_string();
            if texto.is_empty() {
                return false;
            }
            vista
                .update(cx, |v, cx| {
                    v.crear_tarea_destino(org_id, proyecto_id, equipo_id, texto, window, cx);
                })
                .ok();
            true
        }
    };
    let enviar_enter = enviar.clone();
    let _ = window.subscribe(&titulo, cx, move |_, e: &InputEvent, window, cx| {
        if matches!(e, InputEvent::PressEnter { .. }) && enviar_enter(window, cx) {
            window.close_dialog(cx);
        }
    });
    let foco_inicial = Cell::new(true);
    window.open_dialog(cx, move |dialog, window, cx| {
        if foco_inicial.replace(false) {
            titulo.read(cx).focus_handle(cx).focus(window, cx);
        }
        let enviar_btn = enviar.clone();
        dialog
            .title("Nueva tarea")
            .w(px(440.))
            .child(Input::new(&titulo))
            .footer(pie_dialogo(
                "cancelar-tarea-org",
                "crear-tarea-org",
                "Crear",
                false,
                false,
                move |w, cx| {
                    if enviar_btn(w, cx) {
                        w.close_dialog(cx);
                    }
                },
            ))
    });
}
