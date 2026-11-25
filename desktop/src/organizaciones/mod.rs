//! Organizaciones: maestro-detalle con pestañas para proyectos, equipos, miembros,
//! roles, estadísticas y ajustes.

mod datos;
mod equipos;
mod estadisticas;
mod formularios;
mod miembros;
mod proyectos;
mod roles;

use std::rc::Rc;

use gpui_kit::assets::IconName;
use gpui_kit::component::ActiveTheme;
use gpui_kit::component::alert::Alert;
use gpui_kit::component::button::{Button, ButtonVariants as _};
use gpui_kit::component::dialog::DialogButtonProps;
use gpui_kit::component::input::{Input, InputEvent, InputState};
use gpui_kit::component::notification::Notification;
use gpui_kit::component::spinner::Spinner;
use gpui_kit::component::tab::TabBar;
use gpui_kit::component::*;
use gpui_kit::prelude::FluentBuilder as _;
use gpui_kit::*;
use serde_json::json;

use crate::modelos::{
    CatalogoPermisosOrganizacion, Equipo, EstadisticasTareas, EstadoProyecto, EstadoTarea,
    InvitacionOrganizacion, MiembroOrganizacion, Organizacion, Pagina, Proyecto, RolOrganizacion,
    Tag, Tarea,
};

use datos::{inicial_texto, parsear_color_hex};
use formularios::abrir_dialogo_organizacion;

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum PestanaOrg {
    Proyectos,
    Equipos,
    Miembros,
    Roles,
    Estadisticas,
    Ajustes,
}

impl PestanaOrg {
    fn etiqueta(self) -> &'static str {
        match self {
            Self::Proyectos => "Proyectos",
            Self::Equipos => "Equipos",
            Self::Miembros => "Miembros",
            Self::Roles => "Roles",
            Self::Estadisticas => "Estadísticas",
            Self::Ajustes => "Ajustes",
        }
    }
}

struct DetalleCargado {
    org: Organizacion,
    proyectos: Vec<Proyecto>,
    equipos: Vec<Equipo>,
    miembros: Vec<MiembroOrganizacion>,
    tags: Vec<Tag>,
    invitaciones: Vec<InvitacionOrganizacion>,
    roles: Vec<RolOrganizacion>,
    catalogo_permisos: Option<CatalogoPermisosOrganizacion>,
    estadisticas: Option<EstadisticasTareas>,
}

pub struct OrganizacionesView {
    pub(crate) usuario_actual_id: Option<i64>,
    busqueda: Entity<InputState>,
    organizaciones: Vec<Organizacion>,
    total: i64,
    pub(crate) seleccion: Option<i64>,
    cargando_lista: bool,
    error_lista: Option<SharedString>,
    revision_lista: u64,

    organizacion_detalle: Option<Organizacion>,
    pub(crate) proyectos: Vec<Proyecto>,
    pub(crate) equipos: Vec<Equipo>,
    pub(crate) miembros: Vec<MiembroOrganizacion>,
    pub(crate) invitaciones: Vec<InvitacionOrganizacion>,
    pub(crate) roles: Vec<RolOrganizacion>,
    pub(crate) catalogo_permisos: Option<CatalogoPermisosOrganizacion>,
    pub(crate) tags: Vec<Tag>,
    pub(crate) estadisticas: Option<EstadisticasTareas>,
    cargando_detalle: bool,
    error_detalle: Option<SharedString>,
    revision_detalle: u64,

    pestana: PestanaOrg,
    pub(crate) filtro_estado_proyecto: Option<EstadoProyecto>,
    pub(crate) proyecto_activo: Option<i64>,
    pub(crate) tareas_proyecto: Vec<Tarea>,
    pub(crate) cargando_tareas_proyecto: bool,
    pub(crate) error_tareas_proyecto: Option<SharedString>,
    revision_tareas_proyecto: u64,

    pub(crate) filtro_tag_equipo: Option<i64>,
    pub(crate) equipo_activo: Option<i64>,
    pub(crate) tareas_equipo: Vec<Tarea>,
    pub(crate) cargando_tareas_equipo: bool,
    pub(crate) error_tareas_equipo: Option<SharedString>,
    revision_tareas_equipo: u64,

    _suscripciones: Vec<Subscription>,
}

impl OrganizacionesView {
    pub fn new(window: &mut Window, cx: &mut Context<Self>) -> Self {
        let busqueda =
            cx.new(|cx| InputState::new(window, cx).placeholder("Filtrar organizaciones…"));
        let sub = cx.subscribe_in(&busqueda, window, |this, _, e, window, cx| {
            if matches!(e, InputEvent::PressEnter { .. }) {
                this.cargar(window, cx);
            }
        });
        let mut vista = Self {
            usuario_actual_id: None,
            busqueda,
            organizaciones: vec![],
            total: 0,
            seleccion: None,
            cargando_lista: false,
            error_lista: None,
            revision_lista: 0,
            organizacion_detalle: None,
            proyectos: vec![],
            equipos: vec![],
            miembros: vec![],
            invitaciones: vec![],
            roles: vec![],
            catalogo_permisos: None,
            tags: vec![],
            estadisticas: None,
            cargando_detalle: false,
            error_detalle: None,
            revision_detalle: 0,
            pestana: PestanaOrg::Proyectos,
            filtro_estado_proyecto: None,
            proyecto_activo: None,
            tareas_proyecto: vec![],
            cargando_tareas_proyecto: false,
            error_tareas_proyecto: None,
            revision_tareas_proyecto: 0,
            filtro_tag_equipo: None,
            equipo_activo: None,
            tareas_equipo: vec![],
            cargando_tareas_equipo: false,
            error_tareas_equipo: None,
            revision_tareas_equipo: 0,
            _suscripciones: vec![sub],
        };
        vista.cargar(window, cx);
        vista
    }

    pub fn establecer_usuario(&mut self, usuario_id: i64, cx: &mut Context<Self>) {
        self.usuario_actual_id = Some(usuario_id);
        cx.notify();
    }

    pub fn abrir_nueva(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        let weak = cx.entity().downgrade();
        abrir_dialogo_organizacion(None, weak, window, cx);
    }

    pub fn cargar(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        self.revision_lista += 1;
        let revision = self.revision_lista;
        self.cargando_lista = true;
        self.error_lista = None;
        cx.notify();

        let api = crate::api(cx);
        let busqueda = self.busqueda.read(cx).value().trim().to_string();
        let mut ruta = "/organizaciones?limite=50&orden=recientes".to_string();
        if !busqueda.is_empty() {
            ruta.push_str(&format!("&nombre={}", crate::api::codificar(&busqueda)));
        }

        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(async move { api.get::<Pagina<Organizacion>>(&ruta) })
                .await;
            this.update_in(cx, |this, window, cx| {
                if this.revision_lista != revision {
                    return;
                }
                this.cargando_lista = false;
                match r {
                    Ok(p) => {
                        this.total = p.total_elementos;
                        this.organizaciones = p.datos;
                        if !this
                            .organizaciones
                            .iter()
                            .any(|o| Some(o.id) == this.seleccion)
                        {
                            this.seleccion = this.organizaciones.first().map(|o| o.id);
                            this.limpiar_detalle();
                        }
                        if this.seleccion.is_some() {
                            this.cargar_detalle(window, cx);
                        }
                    }
                    Err(e) => this.error_lista = Some(e.mensaje.into()),
                }
                cx.notify();
            })
            .ok();
        })
        .detach();
    }

    pub(crate) fn seleccionar_y_cargar(
        &mut self,
        org_id: i64,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        if self.seleccion != Some(org_id) {
            self.seleccion = Some(org_id);
            self.limpiar_detalle();
        }
        self.cargar(window, cx);
    }

    fn seleccionar(&mut self, org_id: i64, window: &mut Window, cx: &mut Context<Self>) {
        if self.seleccion == Some(org_id) {
            return;
        }
        self.seleccion = Some(org_id);
        self.limpiar_detalle();
        self.cargar_detalle(window, cx);
    }

    fn limpiar_detalle(&mut self) {
        self.organizacion_detalle = None;
        self.proyectos.clear();
        self.equipos.clear();
        self.miembros.clear();
        self.invitaciones.clear();
        self.roles.clear();
        self.catalogo_permisos = None;
        self.tags.clear();
        self.estadisticas = None;
        self.error_detalle = None;
        self.pestana = PestanaOrg::Proyectos;
        self.proyecto_activo = None;
        self.tareas_proyecto.clear();
        self.equipo_activo = None;
        self.tareas_equipo.clear();
        self.filtro_estado_proyecto = None;
        self.filtro_tag_equipo = None;
    }

    pub(crate) fn cargar_detalle(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        let Some(org_id) = self.seleccion else {
            return;
        };
        self.revision_detalle += 1;
        let revision = self.revision_detalle;
        self.cargando_detalle = true;
        self.error_detalle = None;
        cx.notify();

        let api = crate::api(cx);
        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(async move {
                    let org = api.get::<Organizacion>(&format!("/organizaciones/{org_id}"))?;
                    let proyectos =
                        api.get::<Vec<Proyecto>>(&format!("/organizaciones/{org_id}/proyectos"))?;
                    let equipos =
                        api.get::<Vec<Equipo>>(&format!("/organizaciones/{org_id}/equipos"))?;
                    let miembros = api.get::<Vec<MiembroOrganizacion>>(&format!(
                        "/organizaciones/{org_id}/miembros"
                    ))?;
                    let tags = api
                        .get::<Pagina<Tag>>(&format!("/organizaciones/{org_id}/tags?limite=100"))
                        .map(|p| p.datos)
                        .unwrap_or_default();
                    let invitaciones = if org.puede("miembros:invitar") {
                        api.get::<Vec<InvitacionOrganizacion>>(&format!(
                            "/organizaciones/{org_id}/invitaciones"
                        ))
                        .unwrap_or_default()
                    } else {
                        vec![]
                    };
                    let (roles, catalogo_permisos) = if org.puede("roles:gestionar") {
                        let r = api
                            .get::<Vec<RolOrganizacion>>(&format!("/organizaciones/{org_id}/roles"))
                            .unwrap_or_default();
                        let c = api
                            .get::<CatalogoPermisosOrganizacion>(&format!(
                                "/organizaciones/{org_id}/roles/catalogo"
                            ))
                            .ok();
                        (r, c)
                    } else {
                        (vec![], None)
                    };
                    let estadisticas = api
                        .get::<EstadisticasTareas>(&format!(
                            "/tareas/estadisticas?organizacionId={org_id}"
                        ))
                        .ok();

                    Ok::<DetalleCargado, crate::api::ErrorApi>(DetalleCargado {
                        org,
                        proyectos,
                        equipos,
                        miembros,
                        tags,
                        invitaciones,
                        roles,
                        catalogo_permisos,
                        estadisticas,
                    })
                })
                .await;

            this.update_in(cx, |this, window, cx| {
                if this.revision_detalle != revision {
                    return;
                }
                this.cargando_detalle = false;
                match r {
                    Ok(det) => {
                        if let Some(local) =
                            this.organizaciones.iter_mut().find(|o| o.id == det.org.id)
                        {
                            *local = det.org.clone();
                        }
                        this.organizacion_detalle = Some(det.org);
                        this.proyectos = det.proyectos;
                        this.equipos = det.equipos;
                        this.miembros = det.miembros;
                        this.tags = det.tags;
                        this.invitaciones = det.invitaciones;
                        this.roles = det.roles;
                        this.catalogo_permisos = det.catalogo_permisos;
                        this.estadisticas = det.estadisticas;

                        if let Some(pid) = this.proyecto_activo {
                            if this.proyectos.iter().any(|p| p.id == pid) {
                                this.cargar_tareas_proyecto(pid, window, cx);
                            } else {
                                this.proyecto_activo = None;
                            }
                        }
                        if let Some(eid) = this.equipo_activo {
                            if this.equipos.iter().any(|e| e.id == eid) {
                                this.cargar_tareas_equipo(eid, window, cx);
                            } else {
                                this.equipo_activo = None;
                            }
                        }
                    }
                    Err(e) => this.error_detalle = Some(e.mensaje.into()),
                }
                cx.notify();
            })
            .ok();
        })
        .detach();
    }

    pub(crate) fn abrir_proyecto(&mut self, pid: i64, window: &mut Window, cx: &mut Context<Self>) {
        self.proyecto_activo = Some(pid);
        self.cargar_tareas_proyecto(pid, window, cx);
    }

    pub(crate) fn cargar_tareas_proyecto(
        &mut self,
        pid: i64,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        self.revision_tareas_proyecto += 1;
        let revision = self.revision_tareas_proyecto;
        self.cargando_tareas_proyecto = true;
        self.error_tareas_proyecto = None;
        cx.notify();

        let api = crate::api(cx);
        let ruta = format!("/tareas?limite=100&proyectoId={pid}");
        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(async move { api.get::<Pagina<Tarea>>(&ruta) })
                .await;
            this.update(cx, |this, cx| {
                if this.revision_tareas_proyecto != revision {
                    return;
                }
                this.cargando_tareas_proyecto = false;
                match r {
                    Ok(p) => this.tareas_proyecto = p.datos,
                    Err(e) => this.error_tareas_proyecto = Some(e.mensaje.into()),
                }
                cx.notify();
            })
            .ok();
        })
        .detach();
    }

    pub(crate) fn abrir_equipo(&mut self, eid: i64, window: &mut Window, cx: &mut Context<Self>) {
        self.equipo_activo = Some(eid);
        self.cargar_tareas_equipo(eid, window, cx);
    }

    pub(crate) fn cargar_tareas_equipo(
        &mut self,
        eid: i64,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        self.revision_tareas_equipo += 1;
        let revision = self.revision_tareas_equipo;
        self.cargando_tareas_equipo = true;
        self.error_tareas_equipo = None;
        cx.notify();

        let api = crate::api(cx);
        let ruta = format!("/tareas?limite=100&equipoId={eid}");
        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(async move { api.get::<Pagina<Tarea>>(&ruta) })
                .await;
            this.update(cx, |this, cx| {
                if this.revision_tareas_equipo != revision {
                    return;
                }
                this.cargando_tareas_equipo = false;
                match r {
                    Ok(p) => this.tareas_equipo = p.datos,
                    Err(e) => this.error_tareas_equipo = Some(e.mensaje.into()),
                }
                cx.notify();
            })
            .ok();
        })
        .detach();
    }

    pub(crate) fn cambiar_estado_tarea(
        &mut self,
        tarea_id: i64,
        estado: EstadoTarea,
        proyecto_id: Option<i64>,
        equipo_id: Option<i64>,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        let api = crate::api(cx);
        let cuerpo = json!({ "estado": estado.api() });
        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(async move {
                    api.put::<Tarea>(&format!("/tareas/{tarea_id}"), cuerpo)
                })
                .await;
            this.update_in(cx, |this, window, cx| {
                match r {
                    Ok(actualizada) => {
                        if let Some(pid) = proyecto_id {
                            if let Some(local) = this
                                .tareas_proyecto
                                .iter_mut()
                                .find(|t| t.id == actualizada.id)
                            {
                                *local = actualizada.clone();
                            }
                            this.cargar_tareas_proyecto(pid, window, cx);
                        }
                        if let Some(eid) = equipo_id {
                            if let Some(local) = this
                                .tareas_equipo
                                .iter_mut()
                                .find(|t| t.id == actualizada.id)
                            {
                                *local = actualizada;
                            }
                            this.cargar_tareas_equipo(eid, window, cx);
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

    pub(crate) fn confirmar_eliminar_organizacion(
        &mut self,
        org_id: i64,
        nombre: &str,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        let vista = cx.entity().downgrade();
        let titulo = format!("¿Eliminar «{nombre}»?");
        confirmar_peligro(
            titulo,
            "Ningún miembro podrá volver a verla. Solo se recupera desde la base de datos.",
            "Eliminar",
            move |window, cx| {
                vista
                    .update(cx, |v, cx| {
                        v.ejecutar_delete(
                            format!("/organizaciones/{org_id}"),
                            "Organización eliminada.",
                            true,
                            window,
                            cx,
                        );
                    })
                    .ok();
            },
            window,
            cx,
        );
    }

    pub(crate) fn confirmar_eliminar_proyecto(
        &mut self,
        org_id: i64,
        proyecto_id: i64,
        nombre: &str,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        let vista = cx.entity().downgrade();
        let titulo = format!("¿Eliminar el proyecto «{nombre}»?");
        confirmar_peligro(
            titulo,
            "Sus tareas pasan a la organización y sus notas, a quien las creó.",
            "Eliminar",
            move |window, cx| {
                vista
                    .update(cx, |v, cx| {
                        v.proyecto_activo = None;
                        v.ejecutar_delete(
                            format!("/organizaciones/{org_id}/proyectos/{proyecto_id}"),
                            "Proyecto eliminado.",
                            false,
                            window,
                            cx,
                        );
                    })
                    .ok();
            },
            window,
            cx,
        );
    }

    pub(crate) fn confirmar_eliminar_equipo(
        &mut self,
        org_id: i64,
        equipo_id: i64,
        nombre: &str,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        let vista = cx.entity().downgrade();
        let titulo = format!("¿Eliminar el equipo «{nombre}»?");
        confirmar_peligro(
            titulo,
            "Sus tareas pasan a la organización, con sus responsables. Sus miembros siguen en la organización.",
            "Eliminar",
            move |window, cx| {
                vista
                    .update(cx, |v, cx| {
                        v.equipo_activo = None;
                        v.ejecutar_delete(
                            format!("/organizaciones/{org_id}/equipos/{equipo_id}"),
                            "Equipo eliminado.",
                            false,
                            window,
                            cx,
                        );
                    })
                    .ok();
            },
            window,
            cx,
        );
    }

    pub(crate) fn confirmar_eliminar_rol(
        &mut self,
        org_id: i64,
        rol_id: i64,
        nombre: &str,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        let vista = cx.entity().downgrade();
        let titulo = format!("¿Eliminar el rol «{nombre}»?");
        confirmar_peligro(
            titulo,
            "Quienes lo tengan perderán sus permisos en el acto.",
            "Eliminar",
            move |window, cx| {
                vista
                    .update(cx, |v, cx| {
                        v.ejecutar_delete(
                            format!("/organizaciones/{org_id}/roles/{rol_id}"),
                            "Rol eliminado.",
                            false,
                            window,
                            cx,
                        );
                    })
                    .ok();
            },
            window,
            cx,
        );
    }

    pub(crate) fn confirmar_delegar_admin(
        &mut self,
        org_id: i64,
        usuario_id: i64,
        nombre: &str,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        let vista = cx.entity().downgrade();
        let titulo = format!("¿Hacer administrador a {nombre}?");
        let exito = format!("{nombre} es ahora el administrador.");
        confirmar_peligro(
            titulo,
            "Solo hay un administrador: tú pasarás a ser un miembro normal.",
            "Delegar",
            move |window, cx| {
                let exito = exito.clone();
                vista
                    .update(cx, |v, cx| {
                        v.delegar_admin(org_id, usuario_id, exito, window, cx);
                    })
                    .ok();
            },
            window,
            cx,
        );
    }

    fn delegar_admin(
        &mut self,
        org_id: i64,
        usuario_id: i64,
        exito: String,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        let api = crate::api(cx);
        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(async move {
                    api.post::<serde_json::Value>(
                        &format!("/organizaciones/{org_id}/delegar"),
                        json!({ "usuarioId": usuario_id }),
                    )
                })
                .await;
            this.update_in(cx, |this, window, cx| match r {
                Ok(_) => {
                    window.push_notification(Notification::success(exito), cx);
                    this.cargar(window, cx);
                }
                Err(e) => window.push_notification(Notification::error(e.mensaje), cx),
            })
            .ok();
        })
        .detach();
    }

    pub(crate) fn confirmar_quitar_miembro(
        &mut self,
        org_id: i64,
        usuario_id: i64,
        nombre: &str,
        es_salir: bool,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        let vista = cx.entity().downgrade();
        let titulo = if es_salir {
            "¿Salir de la organización?".to_string()
        } else {
            format!("¿Expulsar a {nombre}?")
        };
        let mensaje = if es_salir {
            format!("Dejarás de ver «{nombre}». Para volver necesitarás otra invitación.")
        } else {
            "Perderá el acceso; para volver necesitará otra invitación.".to_string()
        };
        let exito = if es_salir {
            format!("Saliste de {nombre}.")
        } else {
            format!("{nombre} ya no es miembro.")
        };
        confirmar_peligro(
            titulo,
            mensaje,
            if es_salir { "Salir" } else { "Expulsar" },
            move |window, cx| {
                vista
                    .update(cx, |v, cx| {
                        v.ejecutar_delete(
                            format!("/organizaciones/{org_id}/miembros/{usuario_id}"),
                            exito.clone(),
                            es_salir,
                            window,
                            cx,
                        );
                    })
                    .ok();
            },
            window,
            cx,
        );
    }

    pub(crate) fn reenviar_invitacion(
        &mut self,
        org_id: i64,
        inv_id: i64,
        email: &str,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        let api = crate::api(cx);
        let exito = format!("Invitación reenviada a {email}.");
        cx.spawn_in(window, async move |this, cx| {
            let r = cx
                .background_spawn(async move {
                    api.post_vacio(&format!(
                        "/organizaciones/{org_id}/invitaciones/{inv_id}/reenviar"
                    ))
                })
                .await;
            this.update_in(cx, |this, window, cx| match r {
                Ok(()) => {
                    window.push_notification(Notification::success(exito), cx);
                    this.cargar_detalle(window, cx);
                }
                Err(e) => window.push_notification(Notification::error(e.mensaje), cx),
            })
            .ok();
        })
        .detach();
    }

    pub(crate) fn confirmar_cancelar_invitacion(
        &mut self,
        org_id: i64,
        inv_id: i64,
        email: &str,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        let vista = cx.entity().downgrade();
        confirmar_peligro(
            "¿Cancelar invitación?",
            format!("El enlace enviado a {email} dejará de funcionar."),
            "Cancelar invitación",
            move |window, cx| {
                vista
                    .update(cx, |v, cx| {
                        v.ejecutar_delete(
                            format!("/organizaciones/{org_id}/invitaciones/{inv_id}"),
                            "Invitación cancelada.",
                            false,
                            window,
                            cx,
                        );
                    })
                    .ok();
            },
            window,
            cx,
        );
    }

    fn ejecutar_delete(
        &mut self,
        ruta: String,
        exito: impl Into<SharedString>,
        recargar_lista: bool,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        let api = crate::api(cx);
        let exito: SharedString = exito.into();
        cx.spawn_in(window, async move |this, cx| {
            let r = cx.background_spawn(async move { api.delete(&ruta) }).await;
            this.update_in(cx, |this, window, cx| match r {
                Ok(()) => {
                    window.push_notification(Notification::success(exito), cx);
                    if recargar_lista {
                        this.seleccion = None;
                        this.limpiar_detalle();
                        this.cargar(window, cx);
                    } else {
                        this.cargar_detalle(window, cx);
                    }
                }
                Err(e) => window.push_notification(Notification::error(e.mensaje), cx),
            })
            .ok();
        })
        .detach();
    }

    fn pestanas_visibles(org: &Organizacion) -> Vec<PestanaOrg> {
        let mut tabs = vec![
            PestanaOrg::Proyectos,
            PestanaOrg::Equipos,
            PestanaOrg::Miembros,
            PestanaOrg::Estadisticas,
        ];
        if org.puede("roles:gestionar") {
            tabs.push(PestanaOrg::Roles);
        }
        if org.puede("organizacion:editar") || org.is_admin {
            tabs.push(PestanaOrg::Ajustes);
        }
        tabs
    }

    fn fila_organizacion(&self, org: &Organizacion, cx: &mut Context<Self>) -> impl IntoElement {
        let id = org.id;
        let seleccionada = self.seleccion == Some(id);
        let color_avatar = parsear_color_hex(org.color.as_deref());
        let rol = if org.is_admin { "Admin" } else { "Miembro" };
        let desc = org.descripcion.trim();
        let subtitulo = if desc.is_empty() {
            rol.to_string()
        } else {
            format!("{rol} · {desc}")
        };

        h_flex()
            .id(("organizacion", id as u64))
            .gap_2p5()
            .px_3()
            .py_2()
            .rounded(cx.theme().radius)
            .when(seleccionada, |d| d.bg(cx.theme().accent))
            .hover(|d| d.bg(cx.theme().accent.opacity(0.6)))
            .on_click(cx.listener(move |this, _, window, cx| {
                this.seleccionar(id, window, cx);
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
                    .child(inicial_texto(&org.nombre, 'O')),
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
                            .child(org.nombre.clone()),
                    )
                    .child(
                        div()
                            .text_xs()
                            .text_color(cx.theme().muted_foreground)
                            .truncate()
                            .child(subtitulo),
                    ),
            )
    }

    fn render_detalle(&mut self, cx: &mut Context<Self>) -> AnyElement {
        let Some(org) = self.organizacion_detalle.clone().or_else(|| {
            self.seleccion
                .and_then(|id| self.organizaciones.iter().find(|o| o.id == id))
                .cloned()
        }) else {
            if self.cargando_detalle {
                return div()
                    .size_full()
                    .flex()
                    .items_center()
                    .justify_center()
                    .child(Spinner::new())
                    .into_any_element();
            }
            if let Some(err) = &self.error_detalle {
                return div()
                    .p_6()
                    .child(Alert::error("err-detalle-org", err.clone()))
                    .into_any_element();
            }
            return div()
                .size_full()
                .flex()
                .items_center()
                .justify_center()
                .text_color(cx.theme().muted_foreground)
                .child(
                    v_flex()
                        .items_center()
                        .gap_2()
                        .child("Selecciona una organización")
                        .child(
                            Button::new("vacio-nueva-org")
                                .label("Nueva organización")
                                .on_click(cx.listener(|this, _, w, cx| this.abrir_nueva(w, cx))),
                        ),
                )
                .into_any_element();
        };

        let tabs = Self::pestanas_visibles(&org);
        let pestana_actual = if tabs.contains(&self.pestana) {
            self.pestana
        } else {
            PestanaOrg::Proyectos
        };
        let indice = tabs.iter().position(|&t| t == pestana_actual).unwrap_or(0);
        let color_avatar = parsear_color_hex(org.color.as_deref());

        let cuerpo: AnyElement = if self.cargando_detalle && self.organizacion_detalle.is_none() {
            div()
                .size_full()
                .flex()
                .items_center()
                .justify_center()
                .child(Spinner::new())
                .into_any_element()
        } else if let Some(err) = &self.error_detalle
            && self.organizacion_detalle.is_none()
        {
            div()
                .p_6()
                .child(Alert::error("err-detalle-org", err.clone()))
                .into_any_element()
        } else {
            match pestana_actual {
                PestanaOrg::Proyectos => proyectos::render_proyectos(self, &org, cx),
                PestanaOrg::Equipos => equipos::render_equipos(self, &org, cx),
                PestanaOrg::Miembros => miembros::render_miembros(self, &org, cx),
                PestanaOrg::Roles => roles::render_roles(self, &org, cx),
                PestanaOrg::Estadisticas => estadisticas::render_estadisticas(self, cx),
                PestanaOrg::Ajustes => estadisticas::render_ajustes(&org, cx),
            }
        };

        let tabs_click = tabs.clone();
        v_flex()
            .size_full()
            .child(
                v_flex()
                    .px_6()
                    .pt_4()
                    .gap_3()
                    .border_b_1()
                    .border_color(cx.theme().border)
                    .child(
                        h_flex()
                            .gap_3()
                            .justify_between()
                            .child(
                                h_flex()
                                    .gap_3()
                                    .flex_1()
                                    .min_w_0()
                                    .child(
                                        div()
                                            .size_9()
                                            .rounded_full()
                                            .flex_shrink_0()
                                            .flex()
                                            .items_center()
                                            .justify_center()
                                            .text_sm()
                                            .font_semibold()
                                            .map(|d| match color_avatar {
                                                Some(c) => d.bg(c).text_color(gpui_kit::white()),
                                                None => d
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
                                            .child(
                                                div()
                                                    .text_lg()
                                                    .font_semibold()
                                                    .truncate()
                                                    .child(org.nombre.clone()),
                                            )
                                            .when(!org.descripcion.trim().is_empty(), |col| {
                                                col.child(
                                                    div()
                                                        .text_xs()
                                                        .text_color(cx.theme().muted_foreground)
                                                        .truncate()
                                                        .child(org.descripcion.trim().to_string()),
                                                )
                                            }),
                                    ),
                            )
                            .child(
                                Button::new("recargar-org-detalle")
                                    .icon(IconName::RefreshCw)
                                    .ghost()
                                    .small()
                                    .tooltip("Recargar organización")
                                    .on_click(cx.listener(|this, _, w, cx| {
                                        this.cargar_detalle(w, cx);
                                    })),
                            ),
                    )
                    .child(
                        TabBar::new("tabs-organizacion")
                            .underline()
                            .small()
                            .selected_index(indice)
                            .children(tabs.iter().map(|t| t.etiqueta()))
                            .on_click(cx.listener(move |this, i: &usize, _, cx| {
                                if let Some(&tab) = tabs_click.get(*i) {
                                    this.pestana = tab;
                                    cx.notify();
                                }
                            })),
                    ),
            )
            .child(div().flex_1().min_h_0().child(cuerpo))
            .into_any_element()
    }
}

impl Render for OrganizacionesView {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let filas: Vec<_> = self
            .organizaciones
            .iter()
            .map(|o| self.fila_organizacion(o, cx).into_any_element())
            .collect();
        let conteo = if self.total == 1 {
            "1 organización".to_string()
        } else {
            format!("{} organizaciones", self.total)
        };

        let lista = v_flex()
            .w(px(300.))
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
                        Button::new("nueva-organizacion")
                            .icon(IconName::Plus)
                            .small()
                            .tooltip("Nueva organización")
                            .on_click(cx.listener(|this, _, window, cx| {
                                this.abrir_nueva(window, cx);
                            })),
                    ),
            )
            .child(
                v_flex()
                    .id("lista-organizaciones")
                    .flex_1()
                    .min_h_0()
                    .overflow_y_scroll()
                    .px_2()
                    .pb_2()
                    .gap_px()
                    .map(
                        |d| match (&self.error_lista, self.cargando_lista, filas.is_empty()) {
                            (Some(e), _, _) => {
                                d.child(div().p_2().child(Alert::error("error-orgs", e.clone())))
                            }
                            (None, true, true) => {
                                d.child(div().p_4().flex().justify_center().child(Spinner::new()))
                            }
                            (None, false, true) => d.child(
                                div()
                                    .p_4()
                                    .text_sm()
                                    .text_color(cx.theme().muted_foreground)
                                    .child("No hay organizaciones aquí."),
                            ),
                            _ => d.children(filas),
                        },
                    ),
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

        h_flex().items_stretch().size_full().child(lista).child(
            div()
                .flex_1()
                .min_w_0()
                .h_full()
                .child(self.render_detalle(cx)),
        )
    }
}

fn confirmar_peligro(
    titulo: impl Into<SharedString>,
    mensaje: impl Into<SharedString>,
    accion: &'static str,
    al_confirmar: impl Fn(&mut Window, &mut App) + 'static,
    window: &mut Window,
    cx: &mut App,
) {
    let titulo: SharedString = titulo.into();
    let mensaje: SharedString = mensaje.into();
    let al_confirmar = Rc::new(al_confirmar);
    window.open_alert_dialog(cx, move |dialog, _, _| {
        let titulo = titulo.clone();
        let mensaje = mensaje.clone();
        let cb = al_confirmar.clone();
        dialog
            .title(titulo)
            .child(mensaje)
            .button_props(
                DialogButtonProps::default()
                    .ok_text(accion)
                    .ok_variant(gpui_kit::component::button::ButtonVariant::Danger)
                    .show_cancel(true)
                    .cancel_text("Cancelar"),
            )
            .on_ok(move |_, window, cx| {
                cb(window, cx);
                true
            })
    });
}
