//! DTOs del backend (ver `frontend/src/core/api/schema.gen.ts`). Solo los campos que usa la app.

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
    pub fecha_vencimiento: Option<String>,
    pub subtareas: Vec<Subtarea>,
    pub bloqueada: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Nota {
    pub id: i64,
    pub titulo: String,
    pub contenido: String,
    pub is_fijada: bool,
    pub updated_at: String,
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
}
