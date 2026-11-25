//! Utilidades puras, validaciones, catálogo de permisos y tests de organizaciones.

use gpui_kit::{Rgba, rgb};

/// Paleta de acento compartida con móvil para organizaciones, equipos y proyectos.
pub const COLORES_ACENTO: [&str; 8] = [
    "#6366f1", "#4F46E5", "#E11D48", "#059669", "#D97706", "#0284C7", "#7C3AED", "#0D9488",
];

/// Permisos por defecto en caso de que el catálogo llegue vacío (RN-17).
pub const PERMISOS_POR_DEFECTO: [&str; 12] = [
    "organizacion:editar",
    "miembros:invitar",
    "miembros:expulsar",
    "roles:gestionar",
    "equipos:crear",
    "equipos:editar",
    "equipos:eliminar",
    "proyectos:crear",
    "proyectos:editar",
    "proyectos:eliminar",
    "tags:gestionar",
    "plantillas:gestionar",
];

/// Convierte un color hexadecimal `#RRGGBB` en `Rgba` para acentos de datos.
pub fn parsear_color_hex(hex: Option<&str>) -> Option<Rgba> {
    let raw = hex?.trim();
    if raw.is_empty() {
        return None;
    }
    let limpio = raw.strip_prefix('#').unwrap_or(raw);
    if limpio.len() != 6 {
        return None;
    }
    let valor = u32::from_str_radix(limpio, 16).ok()?;
    Some(rgb(valor))
}

/// Inicial en mayúscula para avatares de organización, equipo o miembro.
pub fn inicial_texto(nombre: &str, respaldo: char) -> String {
    nombre
        .trim()
        .chars()
        .next()
        .map(|c| c.to_uppercase().to_string())
        .unwrap_or_else(|| respaldo.to_string())
}

/// Etiqueta legible en español de un permiso de organización (RN-17).
pub fn etiqueta_permiso(permiso: &str) -> &str {
    match permiso {
        "organizacion:editar" => "Editar nombre, descripción, color e imagen",
        "miembros:invitar" => "Invitar y gestionar invitaciones",
        "miembros:expulsar" => "Expulsar miembros",
        "roles:gestionar" => "Crear roles y asignarlos",
        "equipos:crear" => "Crear equipos",
        "equipos:editar" => "Editar equipos",
        "equipos:eliminar" => "Eliminar equipos",
        "proyectos:crear" => "Crear proyectos",
        "proyectos:editar" => "Editar proyectos",
        "proyectos:eliminar" => "Eliminar proyectos",
        "tags:gestionar" => "Gestionar los tags de la organización",
        "plantillas:gestionar" => "Gestionar las plantillas de tareas de la organización",
        _ => permiso,
    }
}

/// Extrae `YYYY-MM-DD` de una fecha ISO-8601.
pub fn formatear_fecha_iso(iso: &str) -> &str {
    iso.split('T').next().unwrap_or(iso)
}

pub fn validar_nombre_y_desc(
    nombre: &str,
    descripcion: &str,
    max_nombre: usize,
    max_desc: usize,
) -> Result<(), &'static str> {
    let n = nombre.trim();
    if n.is_empty() {
        return Err("El nombre es obligatorio.");
    }
    if n.chars().count() > max_nombre {
        return Err("El nombre supera la longitud máxima permitida.");
    }
    if descripcion.trim().chars().count() > max_desc {
        return Err("La descripción supera los 500 caracteres.");
    }
    Ok(())
}

pub fn validar_equipo(
    nombre: &str,
    descripcion: &str,
    miembro_ids: &[i64],
) -> Result<(), &'static str> {
    validar_nombre_y_desc(nombre, descripcion, 100, 500)?;
    if miembro_ids.len() < 2 {
        return Err("Elige al menos 2 miembros para el equipo.");
    }
    Ok(())
}

pub fn es_fecha_iso_valida(fecha: &str) -> bool {
    let bytes = fecha.as_bytes();
    if bytes.len() != 10 || bytes[4] != b'-' || bytes[7] != b'-' {
        return false;
    }
    let partes = [&fecha[0..4], &fecha[5..7], &fecha[8..10]];
    if !partes.iter().all(|p| p.bytes().all(|b| b.is_ascii_digit())) {
        return false;
    }
    let mes: u32 = partes[1].parse().unwrap_or(0);
    let dia: u32 = partes[2].parse().unwrap_or(0);
    (1..=12).contains(&mes) && (1..=31).contains(&dia)
}

pub fn validar_proyecto(
    nombre: &str,
    descripcion: &str,
    fecha_inicio: Option<&str>,
    fecha_fin: Option<&str>,
    equipo_ids: &[i64],
    integrante_ids: &[i64],
) -> Result<(), &'static str> {
    validar_nombre_y_desc(nombre, descripcion, 100, 500)?;
    if let Some(i) = fecha_inicio
        && !es_fecha_iso_valida(i)
    {
        return Err("La fecha de inicio debe tener formato AAAA-MM-DD.");
    }
    if let Some(f) = fecha_fin
        && !es_fecha_iso_valida(f)
    {
        return Err("La fecha de fin debe tener formato AAAA-MM-DD.");
    }
    if let (Some(i), Some(f)) = (fecha_inicio, fecha_fin)
        && f < i
    {
        return Err("La fecha de fin debe ser igual o posterior al inicio.");
    }
    if equipo_ids.is_empty() && integrante_ids.is_empty() {
        return Err("Elige al menos un equipo o una persona.");
    }
    Ok(())
}

pub fn validar_email(email: &str) -> Result<(), &'static str> {
    let limpio = email.trim();
    if limpio.is_empty() {
        return Err("El email es obligatorio.");
    }
    if limpio.chars().any(char::is_whitespace) {
        return Err("El email no puede contener espacios.");
    }
    let Some((local, dominio)) = limpio.split_once('@') else {
        return Err("Email no válido.");
    };
    if local.is_empty() || dominio.is_empty() || dominio.contains('@') {
        return Err("Email no válido.");
    }
    let Some((host, tld)) = dominio.rsplit_once('.') else {
        return Err("Email no válido.");
    };
    if host.is_empty() || tld.is_empty() {
        return Err("Email no válido.");
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::modelos::{
        CatalogoPermisosOrganizacion, Equipo, EstadisticasTareas, EstadoProyecto,
        InvitacionOrganizacion, MiembroEquipo, MiembroOrganizacion, Organizacion, Proyecto,
        RolOrganizacion,
    };

    #[test]
    fn decodifica_organizacion_y_permisos() {
        let json = serde_json::json!({
            "id": 1,
            "nombre": "Acme",
            "descripcion": "Equipo de producto",
            "color": "#6366f1",
            "avatarUrl": null,
            "isAdmin": false,
            "permisos": ["organizacion:editar", "miembros:invitar"]
        });
        let org: Organizacion = serde_json::from_value(json).unwrap();
        assert_eq!(org.id, 1);
        assert!(org.puede("miembros:invitar"));
        assert!(!org.puede("roles:gestionar"));

        let admin = Organizacion {
            is_admin: true,
            ..org
        };
        assert!(admin.puede("roles:gestionar"));
    }

    #[test]
    fn decodifica_miembro_e_invitacion() {
        let m_json = serde_json::json!({
            "usuarioId": 7,
            "nombre": "Beto",
            "email": "beto@ejemplo.com",
            "isAdmin": false,
            "roles": [{ "id": 3, "nombre": "Editor" }]
        });
        let m: MiembroOrganizacion = serde_json::from_value(m_json).unwrap();
        assert_eq!(m.usuario_id, 7);
        assert_eq!(m.roles[0].nombre, "Editor");

        let inv_json = serde_json::json!({
            "id": 9,
            "email": "nuevo@ejemplo.com",
            "expiraEn": "2026-11-05T12:00:00.000Z",
            "isCaducada": false
        });
        let inv: InvitacionOrganizacion = serde_json::from_value(inv_json).unwrap();
        assert_eq!(formatear_fecha_iso(&inv.expira_en), "2026-11-05");
        assert!(!inv.is_caducada);
    }

    #[test]
    fn decodifica_roles_y_catalogo() {
        let rol_json = serde_json::json!({
            "id": 2,
            "nombre": "Coordinación",
            "permisos": ["proyectos:crear", "equipos:crear"],
            "totalMiembros": 4
        });
        let rol: RolOrganizacion = serde_json::from_value(rol_json).unwrap();
        assert_eq!(rol.total_miembros, 4);

        let cat_json = serde_json::json!({
            "permisos": ["organizacion:editar", "roles:gestionar"],
            "plantillas": [{ "nombre": "Gestor", "permisos": ["proyectos:crear"] }]
        });
        let cat: CatalogoPermisosOrganizacion = serde_json::from_value(cat_json).unwrap();
        assert_eq!(cat.plantillas.len(), 1);
        assert_eq!(cat.plantillas[0].nombre, "Gestor");
    }

    #[test]
    fn decodifica_equipo_y_regla_creacion_tareas() {
        let eq_json = serde_json::json!({
            "id": 5,
            "nombre": "Plataforma",
            "descripcion": "",
            "color": "#6366f1",
            "liderId": 10,
            "miembros": [
                { "usuarioId": 10, "puedeCrearTareas": false },
                { "usuarioId": 11, "puedeCrearTareas": true },
                { "usuarioId": 12, "puedeCrearTareas": false }
            ],
            "tagIds": [1, 2]
        });
        let eq: Equipo = serde_json::from_value(eq_json).unwrap();
        assert!(eq.puede_crear_tareas(Some(10)));
        assert!(eq.puede_crear_tareas(Some(11)));
        assert!(!eq.puede_crear_tareas(Some(12)));
        assert!(!eq.puede_crear_tareas(Some(99)));

        let sin_lider = Equipo {
            lider_id: None,
            miembros: vec![MiembroEquipo {
                usuario_id: 12,
                puede_crear_tareas: false,
            }],
            ..eq
        };
        assert!(sin_lider.puede_crear_tareas(Some(12)));
    }

    #[test]
    fn decodifica_proyecto_y_estadisticas() {
        let p_json = serde_json::json!({
            "id": 3,
            "nombre": "Lanzamiento v2",
            "descripcion": "Web nueva",
            "estado": "en_pausa",
            "color": "#f59e0b",
            "fechaInicio": "2026-11-01",
            "fechaFin": "2026-11-30",
            "progreso": { "tareas": 8, "completadas": 3 },
            "equipoIds": [1],
            "integranteIds": [2]
        });
        let p: Proyecto = serde_json::from_value(p_json).unwrap();
        assert_eq!(p.estado, EstadoProyecto::EnPausa);
        assert_eq!(p.estado.etiqueta(), "En pausa");
        assert_eq!(p.progreso.completadas, 3);

        let est_json = serde_json::json!({
            "total": 10,
            "porEstado": { "pendiente": 2, "en_progreso": 3, "completada": 4, "cancelada": 1 },
            "abiertasPorPrioridad": { "baja": 1, "media": 2, "alta": 2 },
            "vencidas": 1,
            "porResponsable": [{ "usuarioId": 7, "abiertas": 3, "completadas": 2 }]
        });
        let est: EstadisticasTareas = serde_json::from_value(est_json).unwrap();
        assert_eq!(est.abiertas(), 5);
        assert_eq!(est.cerradas(), 5);
        assert_eq!(est.porcentaje_avance(), 80);
    }

    #[test]
    fn validadores_organizacion_equipo_proyecto_email() {
        assert!(validar_nombre_y_desc("", "", 100, 500).is_err());
        assert!(validar_nombre_y_desc("Acme", "Desc", 100, 500).is_ok());

        assert!(validar_equipo("Backend", "", &[1]).is_err());
        assert!(validar_equipo("Backend", "", &[1, 2]).is_ok());

        assert!(validar_proyecto("Web", "", None, None, &[], &[]).is_err());
        assert!(
            validar_proyecto("Web", "", Some("2026-11-10"), Some("2026-11-01"), &[1], &[]).is_err()
        );
        assert!(
            validar_proyecto("Web", "", Some("2026-11-01"), Some("2026-11-10"), &[], &[3]).is_ok()
        );
        assert!(validar_proyecto("Web", "", Some("10/11/2026"), None, &[1], &[]).is_err());

        assert!(validar_email("").is_err());
        assert!(validar_email("mal@").is_err());
        assert!(validar_email("ana@acme.com").is_ok());
    }

    #[test]
    fn parsea_colores_hex_e_iniciales() {
        assert!(parsear_color_hex(Some("#6366f1")).is_some());
        assert!(parsear_color_hex(Some("invalido")).is_none());
        assert!(parsear_color_hex(None).is_none());
        assert_eq!(inicial_texto("  acme ", 'O'), "A");
        assert_eq!(inicial_texto("", 'O'), "O");
    }
}
