//! Login con Google por redirección a loopback (RFC 8252): la app escucha en
//! `127.0.0.1:<puerto libre>/<nonce>` y el backend redirige ahí con el refresh token
//! (`GET /api/auth/google?escritorio=<puerto>-<nonce>`, ver `GoogleController`).

use std::io::{Read, Write};
use std::net::TcpListener;
use std::time::{Duration, Instant};

use crate::api::{ErrorApi, Resultado};

const ESPERA_MAXIMA: Duration = Duration::from_secs(5 * 60);

pub fn autenticar(base_api: &str) -> Resultado<String> {
    let escucha = TcpListener::bind("127.0.0.1:0")
        .map_err(|e| error(format!("No se pudo abrir el puerto local ({e})")))?;
    let puerto = escucha
        .local_addr()
        .map_err(|e| error(e.to_string()))?
        .port();
    let nonce = nonce()?;
    open::that_detached(format!(
        "{base_api}/auth/google?escritorio={puerto}-{nonce}"
    ))
    .map_err(|e| error(format!("No se pudo abrir el navegador ({e})")))?;

    // shortcut: un intento abandonado sigue escuchando hasta agotar la espera; cancelable si molesta.
    escucha
        .set_nonblocking(true)
        .map_err(|e| error(e.to_string()))?;
    let limite = Instant::now() + ESPERA_MAXIMA;
    while Instant::now() < limite {
        let Ok((mut conexion, _)) = escucha.accept() else {
            std::thread::sleep(Duration::from_millis(150));
            continue;
        };
        let _ = conexion.set_nonblocking(false);
        let _ = conexion.set_read_timeout(Some(Duration::from_secs(5)));
        let mut bufer = [0u8; 8192];
        let leidos = conexion.read(&mut bufer).unwrap_or(0);
        let peticion = String::from_utf8_lossy(&bufer[..leidos]);
        let primera_linea = peticion.lines().next().unwrap_or_default();

        let resultado = extraer_vuelta(primera_linea, &nonce);
        let (estado, mensaje) = match &resultado {
            Some(Ok(_)) => ("200 OK", "Sesión iniciada. Ya puedes volver a Cosmoflow."),
            Some(Err(_)) => (
                "200 OK",
                "No se pudo iniciar sesión con Google. Vuelve a Cosmoflow e inténtalo de nuevo.",
            ),
            None => ("404 Not Found", "No encontrado."),
        };
        let html = format!(
            "<!doctype html><meta charset=utf-8><title>Cosmoflow</title>\
             <body style=\"font-family:system-ui;text-align:center;padding:48px\"><p>{mensaje}</p>"
        );
        let _ = write!(
            conexion,
            "HTTP/1.1 {estado}\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{html}",
            html.len()
        );
        match resultado {
            Some(Ok(token)) => return Ok(token),
            Some(Err(())) => return Err(error("No se pudo iniciar sesión con Google.".into())),
            None => continue, // otra petición (favicon, etc.): seguir esperando
        }
    }
    Err(error(
        "Se agotó el tiempo de espera del inicio de sesión con Google.".into(),
    ))
}

/// De `GET /<nonce>?refreshToken=… HTTP/1.1` saca el token. `None` si la petición
/// no es la vuelta esperada (otra ruta u otro nonce); `Some(Err)` si Google falló.
fn extraer_vuelta(primera_linea: &str, nonce: &str) -> Option<Result<String, ()>> {
    let ruta = primera_linea.strip_prefix("GET ")?.split(' ').next()?;
    let consulta = ruta.strip_prefix(&format!("/{nonce}?"))?;
    for par in consulta.split('&') {
        match par.split_once('=') {
            Some(("refreshToken", v)) if !v.is_empty() => return Some(decodificar(v).ok_or(())),
            Some(("error", _)) => return Some(Err(())),
            _ => {}
        }
    }
    Some(Err(()))
}

fn decodificar(s: &str) -> Option<String> {
    let mut bytes = Vec::with_capacity(s.len());
    let mut it = s.bytes();
    while let Some(b) = it.next() {
        bytes.push(match b {
            b'%' => {
                let alto = (it.next()? as char).to_digit(16)?;
                let bajo = (it.next()? as char).to_digit(16)?;
                (alto * 16 + bajo) as u8
            }
            b'+' => b' ',
            b => b,
        });
    }
    String::from_utf8(bytes).ok()
}

fn nonce() -> Resultado<String> {
    let mut bytes = [0u8; 16];
    getrandom::fill(&mut bytes).map_err(|e| error(e.to_string()))?;
    Ok(bytes.iter().map(|b| format!("{b:02x}")).collect())
}

fn error(mensaje: String) -> ErrorApi {
    ErrorApi {
        estado: None,
        mensaje,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const N: &str = "0123456789abcdef0123456789abcdef";

    #[test]
    fn extrae_el_token_de_la_vuelta() {
        let linea = format!("GET /{N}?refreshToken=abc%2Bd.e HTTP/1.1");
        assert_eq!(extraer_vuelta(&linea, N), Some(Ok("abc+d.e".into())));
    }

    #[test]
    fn detecta_error_de_google() {
        assert_eq!(
            extraer_vuelta(&format!("GET /{N}?error=google HTTP/1.1"), N),
            Some(Err(()))
        );
    }

    #[test]
    fn ignora_otras_rutas_y_nonces() {
        assert_eq!(extraer_vuelta("GET /favicon.ico HTTP/1.1", N), None);
        assert_eq!(extraer_vuelta("GET /ffff?refreshToken=x HTTP/1.1", N), None);
        assert_eq!(
            extraer_vuelta(&format!("POST /{N}?refreshToken=x HTTP/1.1"), N),
            None
        );
    }

    #[test]
    fn nonce_es_hex_de_32() {
        let n = nonce().unwrap();
        assert_eq!(n.len(), 32);
        assert!(n.bytes().all(|b| b.is_ascii_hexdigit()));
    }
}
