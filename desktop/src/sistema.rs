//! Integración con el sistema operativo: avisos nativos con acciones (completar, posponer).

use gpui_kit::*;
use serde_json::json;

use crate::espacio::IrANotificaciones;
use crate::modelos::{Notificacion, Tarea};

const PREFIJO: &str = "cosmoflow-notif-";
const COMPLETAR: &str = "completar";
const POSPONER: &str = "posponer";

/// Aviso del sistema para una notificación. Los vencimientos de tareas llevan botones.
pub fn aviso(n: &Notificacion) -> SystemNotification {
    let tarea = match (n.tipo.as_deref(), n.recurso_id, n.evento.as_deref()) {
        (Some("tarea"), Some(id), Some("vencimiento")) => Some(id),
        _ => None,
    };
    let accion = |id: &'static str, label: &'static str| SystemNotificationAction {
        id: id.into(),
        label: label.into(),
    };
    SystemNotification {
        tag: etiqueta(n.id, tarea).into(),
        title: n.asunto.clone().into(),
        body: n.texto.clone().into(),
        actions: tarea.map_or_else(Vec::new, |_| {
            vec![
                accion(COMPLETAR, "Completar"),
                accion(POSPONER, "Posponer un día"),
            ]
        }),
    }
}

/// Atiende los clics en los avisos: el cuerpo abre la app en Notificaciones; los botones actúan sin abrirla.
pub fn registrar(cx: &mut App) {
    cx.on_system_notification_response(|respuesta, cx| {
        let Some(accion) = respuesta.action_id else {
            cx.activate(true);
            if let Some(ventana) = cx.windows().first() {
                ventana
                    .update(cx, |_, window, cx| {
                        window.dispatch_action(Box::new(IrANotificaciones), cx)
                    })
                    .ok();
            }
            return;
        };
        let Some((notificacion, Some(tarea))) = leer_etiqueta(&respuesta.tag) else {
            return;
        };
        let api = crate::api(cx);
        let posponer = accion.as_ref() == POSPONER;
        cx.spawn(async move |cx| {
            let r = cx
                .background_spawn(async move {
                    let cambio = if posponer {
                        let actual = api.get::<Tarea>(&format!("/tareas/{tarea}"))?;
                        json!({ "fechaVencimiento": dia_siguiente(actual.fecha_vencimiento.as_deref()) })
                    } else {
                        json!({ "estado": "completada" })
                    };
                    api.put::<Tarea>(&format!("/tareas/{tarea}"), cambio)?;
                    api.put_vacio(&format!("/notificaciones/{notificacion}/leer"))
                })
                .await;
            if let Err(e) = r {
                cx.update(|cx| {
                    cx.show_system_notification(SystemNotification {
                        tag: "cosmoflow-error".into(),
                        title: "No se pudo actualizar la tarea".into(),
                        body: e.mensaje.into(),
                        actions: Vec::new(),
                    })
                });
            }
        })
        .detach();
    });
}

fn etiqueta(notificacion: i64, tarea: Option<i64>) -> String {
    match tarea {
        Some(t) => format!("{PREFIJO}{notificacion}-tarea-{t}"),
        None => format!("{PREFIJO}{notificacion}"),
    }
}

fn leer_etiqueta(tag: &str) -> Option<(i64, Option<i64>)> {
    let resto = tag.strip_prefix(PREFIJO)?;
    match resto.split_once("-tarea-") {
        Some((n, t)) => Some((n.parse().ok()?, Some(t.parse().ok()?))),
        None => Some((resto.parse().ok()?, None)),
    }
}

/// Un día después del vencimiento, o mañana si ya venció o no tiene fecha.
fn dia_siguiente(vencimiento: Option<&str>) -> String {
    let hoy = jiff::ZonedDateTime::now().date();
    let base = vencimiento
        .and_then(|v| v.get(..10)?.parse::<jiff::civil::Date>().ok())
        .filter(|d| *d > hoy)
        .unwrap_or(hoy);
    base.tomorrow().unwrap_or(base).to_string()
}

#[cfg(test)]
mod tests {
    // Sin `use super::*`: traería el `#[test]` de GPUI.
    use super::{dia_siguiente, etiqueta, leer_etiqueta};

    #[test]
    fn la_etiqueta_ida_y_vuelta() {
        assert_eq!(leer_etiqueta(&etiqueta(7, Some(42))), Some((7, Some(42))));
        assert_eq!(leer_etiqueta(&etiqueta(7, None)), Some((7, None)));
        assert_eq!(leer_etiqueta("cosmoflow-notificaciones"), None);
    }

    #[test]
    fn posponer_suma_un_dia_sin_quedar_en_el_pasado() {
        let hoy = jiff::ZonedDateTime::now().date();
        let manana = hoy.tomorrow().unwrap().to_string();
        assert_eq!(dia_siguiente(None), manana);
        assert_eq!(dia_siguiente(Some("2000-01-01")), manana);
        let en_cinco = hoy.checked_add(jiff::Span::new().days(5)).unwrap();
        assert_eq!(
            dia_siguiente(Some(&en_cinco.to_string())),
            en_cinco.tomorrow().unwrap().to_string()
        );
    }
}
