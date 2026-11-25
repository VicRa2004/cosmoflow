//! Cliente HTTP del backend. Bloqueante a propósito: se llama siempre desde
//! `cx.background_spawn`, nunca desde el hilo de la UI.
//!
//! Sesión igual que en móvil (`X-Client-Platform: mobile`): el backend devuelve el
//! refresh token en el cuerpo; se guarda en el llavero del sistema y el access token
//! vive solo en memoria.

use std::sync::{Arc, Mutex};
use std::time::Duration;

use serde::Deserialize;
use serde::de::DeserializeOwned;
use serde_json::Value;
use ureq::Agent;

use crate::modelos::Usuario;

const URL_POR_DEFECTO: &str = "https://cosmoflow.saasil.mx/api";

#[derive(Debug, Clone)]
pub struct ErrorApi {
    pub estado: Option<u16>,
    pub mensaje: String,
}

impl std::fmt::Display for ErrorApi {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.mensaje)
    }
}

pub type Resultado<T> = Result<T, ErrorApi>;

pub enum Login {
    Sesion(Usuario),
    DosPasos(String),
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RespuestaSesion {
    access_token: String,
    refresh_token: Option<String>,
    usuario: Usuario,
}

pub struct Api {
    base: String,
    agente: Agent,
    access_token: Mutex<Option<String>>,
    /// Serializa las renovaciones: con varios 401 a la vez solo uno llama a `/auth/refresh`.
    renovando: Mutex<()>,
}

impl Api {
    pub fn new() -> Arc<Self> {
        let base = std::env::var("COSMOFLOW_API_URL").unwrap_or_else(|_| URL_POR_DEFECTO.into());
        let agente = Agent::config_builder()
            .http_status_as_error(false)
            .timeout_global(Some(Duration::from_secs(15)))
            .build()
            .into();
        Arc::new(Self {
            base: base.trim_end_matches('/').into(),
            agente,
            access_token: Mutex::new(None),
            renovando: Mutex::new(()),
        })
    }

    /// URL de la web (sin `/api`) para abrir en el navegador lo que aún no es nativo.
    pub fn url_web(&self) -> String {
        self.base.trim_end_matches("/api").into()
    }

    pub fn get<T: DeserializeOwned>(&self, ruta: &str) -> Resultado<T> {
        decodificar(self.pedir("GET", ruta, None)?)
    }

    pub fn post<T: DeserializeOwned>(&self, ruta: &str, cuerpo: Value) -> Resultado<T> {
        decodificar(self.pedir("POST", ruta, Some(cuerpo))?)
    }

    pub fn put<T: DeserializeOwned>(&self, ruta: &str, cuerpo: Value) -> Resultado<T> {
        decodificar(self.pedir("PUT", ruta, Some(cuerpo))?)
    }

    pub fn delete(&self, ruta: &str) -> Resultado<()> {
        self.pedir("DELETE", ruta, None).map(|_| ())
    }

    pub fn login(&self, email: &str, password: &str) -> Resultado<Login> {
        let r = self.enviar(
            "POST",
            "/auth/login",
            Some(serde_json::json!({ "email": email.trim(), "password": password })),
            None,
        )?;
        if r.get("requiereDosPasos").and_then(Value::as_bool) == Some(true) {
            let token = r["tokenDosPasos"].as_str().unwrap_or_default().to_string();
            return Ok(Login::DosPasos(token));
        }
        self.guardar_sesion(r).map(Login::Sesion)
    }

    pub fn completar_dos_pasos(&self, token: &str, codigo: &str) -> Resultado<Usuario> {
        let r = self.enviar(
            "POST",
            "/auth/login/dos-pasos",
            Some(serde_json::json!({ "tokenDosPasos": token, "codigo": codigo.trim() })),
            None,
        )?;
        self.guardar_sesion(r)
    }

    /// Login con Google: abre el navegador y espera la vuelta en un puerto local
    /// (redirección a loopback, RFC 8252). Bloquea hasta 5 minutos.
    pub fn login_google(&self) -> Resultado<Usuario> {
        let refresh = crate::google::autenticar(&self.base)?;
        llavero::guardar(&refresh);
        self.renovar()
    }

    /// Recupera la sesión guardada en el llavero al arrancar la app.
    pub fn restaurar(&self) -> Resultado<Usuario> {
        self.renovar()
    }

    pub fn logout(&self) {
        if let Some(refresh) = llavero::leer() {
            let _ = self.enviar("POST", "/auth/logout", None, Some(&refresh));
        }
        llavero::borrar();
        *self.access_token.lock().unwrap() = None;
    }

    fn guardar_sesion(&self, r: Value) -> Resultado<Usuario> {
        let sesion: RespuestaSesion = decodificar(r)?;
        if let Some(refresh) = &sesion.refresh_token {
            llavero::guardar(refresh);
        }
        *self.access_token.lock().unwrap() = Some(sesion.access_token);
        Ok(sesion.usuario)
    }

    fn renovar(&self) -> Resultado<Usuario> {
        let _turno = self.renovando.lock().unwrap();
        let Some(refresh) = llavero::leer() else {
            return Err(ErrorApi {
                estado: Some(401),
                mensaje: "Sin sesión".into(),
            });
        };
        match self.enviar("POST", "/auth/refresh", None, Some(&refresh)) {
            Ok(r) => self.guardar_sesion(r),
            Err(e) => {
                // Solo se borra si el servidor lo rechazó; un fallo de red conserva la sesión.
                if matches!(e.estado, Some(400 | 401 | 403)) {
                    llavero::borrar();
                }
                Err(e)
            }
        }
    }

    fn pedir(&self, metodo: &str, ruta: &str, cuerpo: Option<Value>) -> Resultado<Value> {
        let token_usado = self.access_token.lock().unwrap().clone();
        match self.enviar(metodo, ruta, cuerpo.clone(), None) {
            Err(e) if e.estado == Some(401) => {
                // Otro hilo pudo renovar mientras tanto: solo renovamos si el token no cambió.
                if *self.access_token.lock().unwrap() == token_usado {
                    self.renovar()?;
                }
                self.enviar(metodo, ruta, cuerpo, None)
            }
            r => r,
        }
    }

    fn enviar(
        &self,
        metodo: &str,
        ruta: &str,
        cuerpo: Option<Value>,
        refresh: Option<&str>,
    ) -> Resultado<Value> {
        let url = format!("{}{}", self.base, ruta);
        let token = self.access_token.lock().unwrap().clone();
        // Macro y no closure: los builders con y sin cuerpo son tipos distintos en ureq.
        macro_rules! cabeceras {
            ($b:expr) => {{
                let mut b = $b
                    .header("X-Client-Platform", "mobile")
                    .header("Accept", "application/json");
                if let Some(t) = &token {
                    b = b.header("Authorization", format!("Bearer {t}"));
                }
                if let Some(r) = refresh {
                    b = b.header("X-Refresh-Token", r);
                }
                b
            }};
        }
        let respuesta = match (metodo, cuerpo) {
            ("GET", _) => cabeceras!(self.agente.get(&url)).call(),
            ("DELETE", _) => cabeceras!(self.agente.delete(&url)).call(),
            ("PUT", Some(c)) => cabeceras!(self.agente.put(&url)).send_json(&c),
            (_, Some(c)) => cabeceras!(self.agente.post(&url)).send_json(&c),
            (_, None) => cabeceras!(self.agente.post(&url)).send_empty(),
        };
        let mut respuesta = respuesta.map_err(|e| ErrorApi {
            estado: None,
            mensaje: format!("Sin conexión con el servidor ({e})"),
        })?;
        let estado = respuesta.status().as_u16();
        let texto = respuesta.body_mut().read_to_string().unwrap_or_default();
        let json: Value = serde_json::from_str(&texto).unwrap_or(Value::Null);
        if estado >= 400 {
            let mensaje = json["error"]
                .as_str()
                .unwrap_or("Error inesperado del servidor");
            return Err(ErrorApi {
                estado: Some(estado),
                mensaje: mensaje.into(),
            });
        }
        Ok(json)
    }
}

fn decodificar<T: DeserializeOwned>(v: Value) -> Resultado<T> {
    serde_json::from_value(v).map_err(|e| ErrorApi {
        estado: None,
        mensaje: format!("Respuesta inesperada del servidor ({e})"),
    })
}

/// Refresh token en el llavero del sistema (Keychain, Credential Manager, Secret Service).
mod llavero {
    fn entrada() -> Option<keyring::Entry> {
        keyring::Entry::new("cosmoflow", "refresh_token").ok()
    }
    pub fn leer() -> Option<String> {
        entrada()?.get_password().ok()
    }
    pub fn guardar(token: &str) {
        if let Some(e) = entrada() {
            let _ = e.set_password(token);
        }
    }
    pub fn borrar() {
        if let Some(e) = entrada() {
            let _ = e.delete_credential();
        }
    }
}
