//! Lógica pura y tipos auxiliares para la vista de notas.

use std::collections::HashSet;

use gpui_kit::SharedString;
use gpui_kit::component::select::SelectItem;
use serde_json::json;

use crate::modelos::{Carpeta, Nota};

/// Opción del selector de carpetas (incluye la opción nula inicial).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OpcionCarpeta {
    pub id: Option<i64>,
    pub etiqueta: SharedString,
}

impl SelectItem for OpcionCarpeta {
    type Value = Option<i64>;

    fn title(&self) -> SharedString {
        self.etiqueta.clone()
    }

    fn value(&self) -> &Self::Value {
        &self.id
    }
}

/// Recorrido en profundidad por `padre_id` con nivel de sangría para mostrar el árbol.
/// Resiste ciclos (profundidad máxima 50) y añade al final las carpetas huérfanas.
pub fn carpetas_en_arbol(carpetas: &[Carpeta]) -> Vec<(&Carpeta, usize)> {
    fn visitar<'a>(
        carpetas: &'a [Carpeta],
        padre_id: Option<i64>,
        nivel: usize,
        visitadas: &mut HashSet<i64>,
        salida: &mut Vec<(&'a Carpeta, usize)>,
    ) {
        for c in carpetas.iter().filter(|c| c.padre_id == padre_id) {
            if !visitadas.insert(c.id) {
                continue;
            }
            salida.push((c, nivel));
            if nivel < 50 {
                visitar(carpetas, Some(c.id), nivel + 1, visitadas, salida);
            }
        }
    }

    let mut visitadas = HashSet::with_capacity(carpetas.len());
    let mut salida = Vec::with_capacity(carpetas.len());
    visitar(carpetas, None, 0, &mut visitadas, &mut salida);
    for c in carpetas {
        if visitadas.insert(c.id) {
            salida.push((c, 0));
        }
    }
    salida
}

/// Construye las opciones para el `Select` de carpetas con una opción inicial `None`.
pub fn opciones_carpeta(carpetas: &[Carpeta], texto_ninguna: &str) -> Vec<OpcionCarpeta> {
    let mut opciones = Vec::with_capacity(carpetas.len() + 1);
    opciones.push(OpcionCarpeta {
        id: None,
        etiqueta: texto_ninguna.to_string().into(),
    });
    for (c, nivel) in carpetas_en_arbol(carpetas) {
        let sangria = "   ".repeat(nivel);
        opciones.push(OpcionCarpeta {
            id: Some(c.id),
            etiqueta: format!("{sangria}{}", c.nombre).into(),
        });
    }
    opciones
}

/// Construye la ruta de `GET /api/notas` con búsqueda, tag y carpeta activos.
pub fn ruta_listado(busqueda: &str, tag_id: Option<i64>, carpeta_id: Option<i64>) -> String {
    let mut ruta = "/notas?limite=100".to_string();
    let limpia = busqueda.trim();
    if !limpia.is_empty() {
        ruta.push_str(&format!("&busqueda={}", crate::api::codificar(limpia)));
    }
    if let Some(id) = tag_id {
        ruta.push_str(&format!("&tagId={id}"));
    }
    if let Some(id) = carpeta_id {
        ruta.push_str(&format!("&carpetaId={id}"));
    }
    ruta
}

/// Valida y normaliza el título de una nota antes de enviarla al backend.
pub fn validar_titulo(titulo: &str) -> Result<String, &'static str> {
    let limpio = titulo.trim();
    if limpio.is_empty() {
        Err("El título es obligatorio.")
    } else {
        Ok(limpio.to_string())
    }
}

/// Cuerpo JSON para `POST /api/notas`.
pub fn construir_cuerpo_crear(
    titulo: &str,
    contenido: &str,
    carpeta_id: Option<i64>,
    tag_ids: &[i64],
) -> serde_json::Value {
    json!({
        "titulo": titulo,
        "contenido": contenido,
        "carpetaId": carpeta_id,
        "tagIds": tag_ids,
    })
}

/// Cuerpo JSON para `PUT /api/notas/{id}`, preservando el color existente.
pub fn construir_cuerpo_actualizar(
    titulo: &str,
    contenido: &str,
    color: Option<&str>,
    carpeta_id: Option<i64>,
    tag_ids: &[i64],
) -> serde_json::Value {
    json!({
        "titulo": titulo,
        "contenido": contenido,
        "color": color,
        "carpetaId": carpeta_id,
        "tagIds": tag_ids,
    })
}

/// Ordena fijadas primero y luego por fecha de actualización descendente.
pub fn ordenar_notas(notas: &mut [Nota]) {
    notas.sort_by(|a, b| {
        b.is_fijada
            .cmp(&a.is_fijada)
            .then_with(|| b.updated_at.cmp(&a.updated_at))
            .then_with(|| b.id.cmp(&a.id))
    });
}

/// Extrae `YYYY-MM-DD` de una marca ISO-8601 para mostrarla en la lista y cabecera.
pub fn formatear_fecha(iso: &str) -> &str {
    iso.split('T').next().unwrap_or(iso)
}

/// Resume carpeta (si aplica) y primera vista del contenido en una línea para la fila.
pub fn extracto_nota(contenido: &str, carpeta: Option<&str>) -> Option<String> {
    let extracto: String = contenido.split_whitespace().collect::<Vec<_>>().join(" ");
    let mut partes = Vec::with_capacity(2);
    if let Some(nombre) = carpeta.map(str::trim).filter(|s| !s.is_empty()) {
        partes.push(nombre.to_string());
    }
    if !extracto.is_empty() {
        partes.push(extracto);
    }
    if partes.is_empty() {
        None
    } else {
        Some(partes.join(" · "))
    }
}

/// Indica si la nota cumple los filtros activos de tag y carpeta.
pub fn nota_coincide_filtros(nota: &Nota, tag_id: Option<i64>, carpeta_id: Option<i64>) -> bool {
    let coincide_tag = tag_id.is_none_or(|id| nota.tag_ids.contains(&id));
    let coincide_carpeta = carpeta_id.is_none_or(|id| nota.carpeta_id == Some(id));
    coincide_tag && coincide_carpeta
}

#[cfg(test)]
mod tests {
    use super::*;

    fn carpeta(id: i64, nombre: &str, padre_id: Option<i64>) -> Carpeta {
        Carpeta {
            id,
            nombre: nombre.into(),
            padre_id,
        }
    }

    #[test]
    fn formatea_fecha_iso() {
        assert_eq!(formatear_fecha("2026-10-28T10:00:00Z"), "2026-10-28");
        assert_eq!(formatear_fecha("2026-10-28"), "2026-10-28");
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
                ..Default::default()
            },
            Nota {
                id: 2,
                titulo: "Fijada vieja".into(),
                contenido: String::new(),
                is_fijada: true,
                updated_at: "2026-09-01T10:00:00Z".into(),
                ..Default::default()
            },
            Nota {
                id: 3,
                titulo: "Reciente".into(),
                contenido: String::new(),
                is_fijada: false,
                updated_at: "2026-10-20T10:00:00Z".into(),
                ..Default::default()
            },
        ];
        ordenar_notas(&mut notas);
        let ids: Vec<_> = notas.iter().map(|n| n.id).collect();
        assert_eq!(ids, vec![2, 3, 1]);
    }

    #[test]
    fn carpetas_en_arbol_anida_y_resiste_ciclos_y_huerfanas() {
        let carpetas = vec![
            carpeta(1, "Trabajo", None),
            carpeta(2, "Proyectos", Some(1)),
            carpeta(3, "Personal", None),
            carpeta(4, "Ciclo A", Some(5)),
            carpeta(5, "Ciclo B", Some(4)),
            carpeta(6, "Huérfana", Some(999)),
        ];
        let arbol: Vec<_> = carpetas_en_arbol(&carpetas)
            .into_iter()
            .map(|(c, nivel)| (c.id, nivel))
            .collect();
        assert_eq!(arbol, vec![(1, 0), (2, 1), (3, 0), (4, 0), (5, 0), (6, 0)]);
    }

    #[test]
    fn opciones_carpeta_incluye_texto_ninguna_y_sangria() {
        let carpetas = vec![carpeta(1, "Raíz", None), carpeta(2, "Sub", Some(1))];
        let ops = opciones_carpeta(&carpetas, "Sin carpeta");
        assert_eq!(ops.len(), 3);
        assert_eq!(ops[0].id, None);
        assert_eq!(ops[0].etiqueta.as_ref(), "Sin carpeta");
        assert_eq!(ops[1].id, Some(1));
        assert_eq!(ops[1].etiqueta.as_ref(), "Raíz");
        assert_eq!(ops[2].id, Some(2));
        assert_eq!(ops[2].etiqueta.as_ref(), "   Sub");
    }

    #[test]
    fn ruta_listado_construye_query_con_filtros() {
        assert_eq!(ruta_listado("  ", None, None), "/notas?limite=100");
        assert_eq!(
            ruta_listado("diseño & notas", Some(7), Some(3)),
            "/notas?limite=100&busqueda=dise%C3%B1o%20%26%20notas&tagId=7&carpetaId=3"
        );
    }

    #[test]
    fn extracto_nota_combina_carpeta_y_contenido() {
        assert_eq!(extracto_nota("  \n ", None), None);
        assert_eq!(
            extracto_nota("Primera   línea\nsegunda", Some("Trabajo")),
            Some("Trabajo · Primera línea segunda".into())
        );
        assert_eq!(extracto_nota("Solo texto", None), Some("Solo texto".into()));
        assert_eq!(extracto_nota("", Some("Personal")), Some("Personal".into()));
    }

    #[test]
    fn validar_titulo_rechaza_vacio_y_recorta() {
        assert!(validar_titulo("   ").is_err());
        assert_eq!(validar_titulo("  Apuntes  "), Ok("Apuntes".into()));
    }

    #[test]
    fn construir_cuerpos_incluye_carpeta_y_tags() {
        let crear = construir_cuerpo_crear("Título", "Texto", Some(4), &[1, 2]);
        assert_eq!(
            crear,
            json!({
                "titulo": "Título",
                "contenido": "Texto",
                "carpetaId": 4,
                "tagIds": [1, 2],
            })
        );
        let actualizar = construir_cuerpo_actualizar("Título", "Texto", Some("#f59e0b"), None, &[]);
        assert_eq!(
            actualizar,
            json!({
                "titulo": "Título",
                "contenido": "Texto",
                "color": "#f59e0b",
                "carpetaId": null,
                "tagIds": [],
            })
        );
    }

    #[test]
    fn nota_coincide_filtros_evalua_tag_y_carpeta() {
        let nota = Nota {
            id: 1,
            carpeta_id: Some(5),
            tag_ids: vec![10, 20],
            ..Default::default()
        };
        assert!(nota_coincide_filtros(&nota, None, None));
        assert!(nota_coincide_filtros(&nota, Some(10), Some(5)));
        assert!(!nota_coincide_filtros(&nota, Some(30), Some(5)));
        assert!(!nota_coincide_filtros(&nota, Some(10), Some(6)));
    }
}
