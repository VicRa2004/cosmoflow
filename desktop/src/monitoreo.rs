//! Errores a Sentry/GlitchTip (mismo criterio que backend y web, commit `a61852e`):
//! desactivado sin DSN y sin datos personales: solo el id del usuario, sin breadcrumbs,
//! sin petición y sin nombre del equipo.

/// El DSN llega al compilar (`SENTRY_DSN` en el CI) y se puede sobrescribir al ejecutar.
fn dsn() -> Option<String> {
    std::env::var("SENTRY_DSN")
        .ok()
        .or_else(|| option_env!("SENTRY_DSN").map(String::from))
        .filter(|d| !d.trim().is_empty())
}

/// Hay que mantener vivo el guard durante toda la app: al soltarlo se envía lo pendiente.
pub fn iniciar() -> Option<sentry::ClientInitGuard> {
    let dsn = dsn()?;
    let mut opciones = sentry::ClientOptions::new();
    opciones.release = Some(format!("cosmoflow-desktop@{}", env!("CARGO_PKG_VERSION")).into());
    opciones.environment = Some(
        if cfg!(debug_assertions) {
            "development"
        } else {
            "production"
        }
        .into(),
    );
    opciones.send_default_pii = false;
    opciones.max_breadcrumbs = 0;
    opciones.before_send = Some(std::sync::Arc::new(|mut evento| {
        evento.server_name = None;
        evento.request = None;
        evento.user = evento.user.map(|u| sentry::User {
            id: u.id,
            ..Default::default()
        });
        Some(evento)
    }));
    Some(sentry::init((dsn, opciones)))
}

/// Asocia los errores al usuario (solo su id); `None` al cerrar sesión.
pub fn usuario(id: Option<i64>) {
    sentry::configure_scope(|scope| {
        scope.set_user(id.map(|id| sentry::User {
            id: Some(id.to_string()),
            ..Default::default()
        }));
    });
}
