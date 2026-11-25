//! DTOs del backend (ver `frontend/src/core/api/schema.gen.ts`). Solo los campos que usa la app.

use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Usuario {
    pub id: i64,
    pub nombre: String,
    pub email: String,
    #[serde(default)]
    pub email_verificado: bool,
    #[serde(default)]
    pub avatar_url: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Pagina<T> {
    pub datos: Vec<T>,
    pub total_elementos: i64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EstadoTarea {
    Pendiente,
    EnProgreso,
    Completada,
    Cancelada,
}

impl EstadoTarea {
    pub const TODOS: [Self; 4] = [
        Self::Pendiente,
        Self::EnProgreso,
        Self::Completada,
        Self::Cancelada,
    ];

    pub fn api(self) -> &'static str {
        match self {
            Self::Pendiente => "pendiente",
            Self::EnProgreso => "en_progreso",
            Self::Completada => "completada",
            Self::Cancelada => "cancelada",
        }
    }

    pub fn etiqueta(self) -> &'static str {
        match self {
            Self::Pendiente => "Pendiente",
            Self::EnProgreso => "En progreso",
            Self::Completada => "Completada",
            Self::Cancelada => "Cancelada",
        }
    }

    pub fn is_abierta(self) -> bool {
        matches!(self, Self::Pendiente | Self::EnProgreso)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Prioridad {
    Baja,
    Media,
    Alta,
}

impl Prioridad {
    pub const TODAS: [Self; 3] = [Self::Baja, Self::Media, Self::Alta];

    pub fn api(self) -> &'static str {
        match self {
            Self::Baja => "baja",
            Self::Media => "media",
            Self::Alta => "alta",
        }
    }

    pub fn etiqueta(self) -> &'static str {
        match self {
            Self::Baja => "Baja",
            Self::Media => "Media",
            Self::Alta => "Alta",
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Subtarea {
    pub id: i64,
    pub titulo: String,
    pub completada: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Tarea {
    pub id: i64,
    pub titulo: String,
    pub contenido: String,
    pub estado: EstadoTarea,
    pub prioridad: Prioridad,
    pub fecha_inicio: Option<String>,
    pub fecha_vencimiento: Option<String>,
    pub color: Option<String>,
    #[serde(default)]
    pub tag_ids: Vec<i64>,
    #[serde(default)]
    pub responsable_ids: Vec<i64>,
    pub organizacion_id: Option<i64>,
    pub proyecto_id: Option<i64>,
    pub subtareas: Vec<Subtarea>,
    pub bloqueada: bool,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Nota {
    pub id: i64,
    pub titulo: String,
    pub contenido: String,
    pub is_fijada: bool,
    pub updated_at: String,
    pub color: Option<String>,
    pub tag_ids: Vec<i64>,
    pub carpeta_id: Option<i64>,
    pub organizacion_id: Option<i64>,
    pub proyecto_id: Option<i64>,
}

/// Tag del usuario (`GET /api/tags`) o de una organización.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Tag {
    pub id: i64,
    pub nombre: String,
    pub color: Option<String>,
}

/// Carpeta de notas (`GET /api/carpetas`); `padre_id` forma el árbol.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Carpeta {
    pub id: i64,
    pub nombre: String,
    pub padre_id: Option<i64>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ActorNotificacion {
    pub nombre: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Notificacion {
    pub id: i64,
    pub asunto: String,
    pub texto: String,
    pub actor: Option<ActorNotificacion>,
    pub leida: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BandejaNotificaciones {
    pub datos: Vec<Notificacion>,
    pub total_elementos: i64,
    pub no_leidas: usize,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Organizacion {
    pub id: i64,
    pub nombre: String,
    pub descripcion: String,
    pub color: Option<String>,
    pub avatar_url: Option<String>,
    pub is_admin: bool,
    pub permisos: Vec<String>,
}

impl Organizacion {
    /// Comprueba si el usuario tiene un permiso dentro de esta organización.
    pub fn puede(&self, permiso: &str) -> bool {
        self.is_admin || self.permisos.iter().any(|p| p == permiso)
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RolResumen {
    pub id: i64,
    pub nombre: String,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct MiembroOrganizacion {
    pub usuario_id: i64,
    pub nombre: String,
    pub email: String,
    pub avatar_url: Option<String>,
    pub is_admin: bool,
    pub roles: Vec<RolResumen>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct InvitacionOrganizacion {
    pub id: i64,
    pub email: String,
    pub expira_en: String,
    pub is_caducada: bool,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct RolOrganizacion {
    pub id: i64,
    pub nombre: String,
    pub permisos: Vec<String>,
    pub total_miembros: i64,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct PlantillaRol {
    pub nombre: String,
    pub permisos: Vec<String>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct CatalogoPermisosOrganizacion {
    pub permisos: Vec<String>,
    pub plantillas: Vec<PlantillaRol>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct MiembroEquipo {
    pub usuario_id: i64,
    pub puede_crear_tareas: bool,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Equipo {
    pub id: i64,
    pub nombre: String,
    pub descripcion: String,
    pub color: Option<String>,
    pub avatar_url: Option<String>,
    pub lider_id: Option<i64>,
    pub miembros: Vec<MiembroEquipo>,
    pub tag_ids: Vec<i64>,
}

impl Equipo {
    /// RN-22: sin líder, cualquier miembro del equipo puede crear tareas;
    /// con líder, solo el líder o quien tenga `puede_crear_tareas`.
    pub fn puede_crear_tareas(&self, usuario_id: Option<i64>) -> bool {
        let Some(uid) = usuario_id else {
            return false;
        };
        let Some(miembro) = self.miembros.iter().find(|m| m.usuario_id == uid) else {
            return false;
        };
        match self.lider_id {
            None => true,
            Some(lider) => lider == uid || miembro.puede_crear_tareas,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EstadoProyecto {
    #[default]
    Activo,
    EnPausa,
    Terminado,
}

impl EstadoProyecto {
    pub const TODOS: [Self; 3] = [Self::Activo, Self::EnPausa, Self::Terminado];

    pub fn api(self) -> &'static str {
        match self {
            Self::Activo => "activo",
            Self::EnPausa => "en_pausa",
            Self::Terminado => "terminado",
        }
    }

    pub fn etiqueta(self) -> &'static str {
        match self {
            Self::Activo => "Activo",
            Self::EnPausa => "En pausa",
            Self::Terminado => "Terminado",
        }
    }
}

#[derive(Debug, Clone, Copy, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct ProgresoProyecto {
    pub tareas: i64,
    pub completadas: i64,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Proyecto {
    pub id: i64,
    pub nombre: String,
    pub descripcion: String,
    pub estado: EstadoProyecto,
    pub color: Option<String>,
    pub fecha_inicio: Option<String>,
    pub fecha_fin: Option<String>,
    pub progreso: ProgresoProyecto,
    pub equipo_ids: Vec<i64>,
    pub integrante_ids: Vec<i64>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct ResponsableEstadistica {
    pub usuario_id: i64,
    pub abiertas: i64,
    pub completadas: i64,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "snake_case", default)]
pub struct EstadisticasPorEstado {
    pub pendiente: i64,
    pub en_progreso: i64,
    pub completada: i64,
    pub cancelada: i64,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct EstadisticasPorPrioridad {
    pub baja: i64,
    pub media: i64,
    pub alta: i64,
}

/// Respuesta de `GET /api/tareas/estadisticas`.
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct EstadisticasTareas {
    pub total: i64,
    pub por_estado: EstadisticasPorEstado,
    pub abiertas_por_prioridad: EstadisticasPorPrioridad,
    pub vencidas: i64,
    pub por_responsable: Vec<ResponsableEstadistica>,
}

fn prioridad_por_defecto() -> Prioridad {
    Prioridad::Media
}

/// Plantilla de tarea (`GET /api/plantillas` o `/api/organizaciones/{id}/plantillas`).
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlantillaTarea {
    pub id: i64,
    pub nombre: String,
    pub titulo: String,
    #[serde(default)]
    pub contenido: String,
    #[serde(default = "prioridad_por_defecto")]
    pub prioridad: Prioridad,
    #[serde(default)]
    pub color: Option<String>,
    #[serde(default)]
    pub subtareas: Vec<String>,
}

/// Preferencia de notificación por evento y canal (`GET/PUT /api/notificaciones/preferencias`).
#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PreferenciaNotificacion {
    pub evento: String,
    pub canal: String,
    pub activo: bool,
    #[serde(default)]
    pub personalizado: bool,
}

/// Estado del canal Telegram (`GET /api/notificaciones/telegram`).
#[derive(Debug, Clone, Copy, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EstadoTelegram {
    #[serde(default)]
    pub disponible: bool,
    #[serde(default)]
    pub vinculado: bool,
}

impl EstadisticasTareas {
    pub fn abiertas(&self) -> i64 {
        self.por_estado.pendiente + self.por_estado.en_progreso
    }

    pub fn cerradas(&self) -> i64 {
        self.por_estado.completada + self.por_estado.cancelada
    }

    pub fn porcentaje_avance(&self) -> i64 {
        let cerradas = self.cerradas();
        if cerradas == 0 {
            0
        } else {
            ((self.por_estado.completada as f64 / cerradas as f64) * 100.0).round() as i64
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decodifica_tarea_del_backend() {
        let json = serde_json::json!({
            "id": 1, "titulo": "Demo", "contenido": "", "estado": "en_progreso",
            "prioridad": "alta", "fechaVencimiento": null, "isFijada": false,
            "subtareas": [{ "id": 1, "titulo": "a", "completada": true }],
            "bloqueada": false, "tagIds": [], "color": null
        });
        let t: Tarea = serde_json::from_value(json).unwrap();
        assert_eq!(t.estado, EstadoTarea::EnProgreso);
        assert_eq!(t.estado.api(), "en_progreso");
        assert_eq!(t.prioridad, Prioridad::Alta);
    }

    #[test]
    fn decodifica_nota_del_backend() {
        let json = serde_json::json!({
            "id": 42,
            "titulo": "Ideas para el viaje",
            "contenido": "## Lugares\n- Lisboa",
            "color": "#f59e0b",
            "isFijada": true,
            "tagIds": [1, 2],
            "organizacionId": null,
            "proyectoId": null,
            "carpetaId": 3,
            "updatedAt": "2026-10-28T10:00:00Z",
            "createdAt": "2026-10-27T10:00:00Z"
        });
        let n: Nota = serde_json::from_value(json).unwrap();
        assert_eq!(n.id, 42);
        assert_eq!(n.titulo, "Ideas para el viaje");
        assert_eq!(n.contenido, "## Lugares\n- Lisboa");
        assert!(n.is_fijada);
        assert_eq!(n.updated_at, "2026-10-28T10:00:00Z");
    }

    #[test]
    fn decodifica_bandeja_notificaciones() {
        let json = serde_json::json!({
            "datos": [
                {
                    "id": 42,
                    "asunto": "Te asignaron una tarea: Preparar demo",
                    "texto": "Ana te asignó la tarea «Preparar demo».",
                    "enlace": "https://app.cosmoflow.dev/tareas/42",
                    "tipo": "tarea",
                    "recursoId": 42,
                    "evento": "tareaAsignada",
                    "actor": { "id": 7, "nombre": "Ana" },
                    "tarea": {
                        "titulo": "Preparar demo",
                        "responsables": [
                            { "id": 7, "nombre": "Ana", "asignadoPor": null }
                        ]
                    },
                    "leida": false,
                    "createdAt": "2026-11-20T18:00:00.000Z"
                }
            ],
            "pagina": 1,
            "totalElementos": 3,
            "totalPaginas": 1,
            "noLeidas": 2
        });
        let bandeja: BandejaNotificaciones = serde_json::from_value(json).unwrap();
        assert_eq!(bandeja.total_elementos, 3);
        assert_eq!(bandeja.no_leidas, 2);
        assert_eq!(bandeja.datos.len(), 1);
        let n = &bandeja.datos[0];
        assert_eq!(n.id, 42);
        assert_eq!(n.asunto, "Te asignaron una tarea: Preparar demo");
        assert_eq!(n.texto, "Ana te asignó la tarea «Preparar demo».");
        assert_eq!(n.actor.as_ref().map(|a| a.nombre.as_str()), Some("Ana"));
        assert!(!n.leida);
        assert_eq!(n.created_at, "2026-11-20T18:00:00.000Z");
    }

    #[test]
    fn decodifica_estadisticas_tareas() {
        let json = serde_json::json!({
            "total": 12,
            "porEstado": {
                "pendiente": 4,
                "en_progreso": 2,
                "completada": 5,
                "cancelada": 1
            },
            "abiertasPorPrioridad": {
                "baja": 1,
                "media": 3,
                "alta": 2
            },
            "vencidas": 1,
            "porResponsable": [
                { "usuarioId": 7, "abiertas": 3, "completadas": 4 }
            ]
        });
        let est: EstadisticasTareas = serde_json::from_value(json).unwrap();
        assert_eq!(est.total, 12);
        assert_eq!(est.por_estado.pendiente, 4);
        assert_eq!(est.por_estado.en_progreso, 2);
        assert_eq!(est.por_estado.completada, 5);
        assert_eq!(est.por_estado.cancelada, 1);
        assert_eq!(est.abiertas_por_prioridad.baja, 1);
        assert_eq!(est.abiertas_por_prioridad.media, 3);
        assert_eq!(est.abiertas_por_prioridad.alta, 2);
        assert_eq!(est.vencidas, 1);
        assert_eq!(est.por_responsable.len(), 1);
        assert_eq!(est.por_responsable[0].usuario_id, 7);
        assert_eq!(est.por_responsable[0].abiertas, 3);
        assert_eq!(est.por_responsable[0].completadas, 4);
    }

    #[test]
    fn decodifica_usuario_con_verificacion_y_avatar() {
        let json = serde_json::json!({
            "id": 9,
            "nombre": "Ada Lovelace",
            "email": "ada@cosmoflow.dev",
            "emailVerificado": true,
            "avatarUrl": "/api/avatares/9?v=123"
        });
        let u: Usuario = serde_json::from_value(json).unwrap();
        assert_eq!(u.id, 9);
        assert_eq!(u.nombre, "Ada Lovelace");
        assert!(u.email_verificado);
        assert_eq!(u.avatar_url.as_deref(), Some("/api/avatares/9?v=123"));
    }

    #[test]
    fn decodifica_plantilla_tarea() {
        let json = serde_json::json!({
            "id": 5,
            "nombre": "Release",
            "titulo": "Preparar release",
            "contenido": "## Checklist",
            "prioridad": "alta",
            "color": "#4F46E5",
            "subtareas": ["Ejecutar tests", "Publicar tag"]
        });
        let p: PlantillaTarea = serde_json::from_value(json).unwrap();
        assert_eq!(p.id, 5);
        assert_eq!(p.nombre, "Release");
        assert_eq!(p.prioridad, Prioridad::Alta);
        assert_eq!(p.color.as_deref(), Some("#4F46E5"));
        assert_eq!(p.subtareas, vec!["Ejecutar tests", "Publicar tag"]);
    }

    #[test]
    fn decodifica_preferencia_y_telegram() {
        let pref_json = serde_json::json!({
            "evento": "tareaAsignada",
            "canal": "correo",
            "activo": true,
            "personalizado": false
        });
        let pref: PreferenciaNotificacion = serde_json::from_value(pref_json).unwrap();
        assert_eq!(pref.evento, "tareaAsignada");
        assert_eq!(pref.canal, "correo");
        assert!(pref.activo);
        assert!(!pref.personalizado);

        let tg_json = serde_json::json!({ "disponible": true, "vinculado": false });
        let tg: EstadoTelegram = serde_json::from_value(tg_json).unwrap();
        assert!(tg.disponible);
        assert!(!tg.vinculado);
    }
}
