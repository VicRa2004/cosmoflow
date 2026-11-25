//! DTOs del backend (ver `frontend/src/core/api/schema.gen.ts`). Solo los campos que usa la app.
// shortcut: temporal mientras se implementan las vistas que usan Tag, Carpeta y los campos nuevos; quitar al integrarlas.
#![allow(dead_code)]

use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Usuario {
    pub id: i64,
    pub nombre: String,
    pub email: String,
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
    pub is_fijada: bool,
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
    pub color: Option<String>,
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
}
