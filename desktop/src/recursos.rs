//! Recursos embebidos: iconos Lucide que no trae `Assets` por defecto y la fuente Inter de la web.

use std::borrow::Cow;

use gpui_kit::assets::{Assets, icon_assets};
use gpui_kit::*;

// `Assets` solo embebe los ~100 iconos de los componentes; los demás que use la app van aquí
// (un icono no registrado se pinta vacío; el test de abajo lo detecta).
icon_assets!(
    Iconos,
    [
        BellOff,
        CalendarDays,
        CheckCheck,
        CircleDot,
        Clock,
        Crown,
        Download,
        Eye,
        FilePlus,
        Hexagon,
        Key,
        LayoutTemplate,
        ListChecks,
        ListTodo,
        LogOut,
        Mail,
        Pencil,
        Pin,
        PinOff,
        Save,
        Send,
        Shield,
        SquareCheck,
        StickyNote,
        Tag,
        Tags,
        UserCheck,
        UserMinus,
        UserPlus,
        X,
    ]
);

pub struct Recursos;

impl AssetSource for Recursos {
    fn load(&self, path: &str) -> Result<Option<Cow<'static, [u8]>>> {
        match Iconos.load(path)? {
            Some(bytes) => Ok(Some(bytes)),
            None => Assets.load(path),
        }
    }

    fn list(&self, path: &str) -> Result<Vec<SharedString>> {
        let mut rutas = Assets.list(path)?;
        rutas.extend(Iconos.list(path)?);
        rutas.sort();
        rutas.dedup();
        Ok(rutas)
    }
}

/// Inter (la misma de la web, subconjunto latino) en los pesos que usa la interfaz.
pub fn registrar_fuentes(cx: &App) {
    let fuentes = [
        include_bytes!("../fuentes/Inter-Regular.ttf").as_slice(),
        include_bytes!("../fuentes/Inter-Medium.ttf"),
        include_bytes!("../fuentes/Inter-SemiBold.ttf"),
        include_bytes!("../fuentes/Inter-Bold.ttf"),
    ];
    if let Err(e) = cx
        .text_system()
        .add_fonts(fuentes.into_iter().map(Cow::Borrowed).collect())
    {
        eprintln!("no se pudo cargar Inter: {e}");
    }
}

#[cfg(test)]
mod tests {
    use super::{AssetSource, Recursos};

    /// `FooBar2` → `icons/foo-bar-2.svg`, igual que el catálogo Lucide.
    fn ruta(nombre: &str) -> String {
        let mut kebab = String::new();
        let mut previo: Option<char> = None;
        for c in nombre.chars() {
            if let Some(p) = previo {
                let corte = (c.is_ascii_uppercase()
                    && (p.is_ascii_lowercase() || p.is_ascii_digit()))
                    || (c.is_ascii_digit() && p.is_ascii_alphabetic());
                if corte {
                    kebab.push('-');
                }
            }
            kebab.push(c.to_ascii_lowercase());
            previo = Some(c);
        }
        format!("icons/{kebab}.svg")
    }

    #[test]
    fn todos_los_iconos_usados_estan_embebidos() {
        let mut faltan = vec![];
        let mut pendientes = vec![std::path::PathBuf::from(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/src"
        ))];
        while let Some(dir) = pendientes.pop() {
            for entrada in std::fs::read_dir(dir).unwrap().flatten() {
                let p = entrada.path();
                if p.is_dir() {
                    pendientes.push(p);
                    continue;
                }
                let codigo = std::fs::read_to_string(&p).unwrap();
                for trozo in codigo.split(concat!("IconName", "::")).skip(1) {
                    let nombre: String = trozo
                        .chars()
                        .take_while(|c| c.is_ascii_alphanumeric())
                        .collect();
                    let ruta = ruta(&nombre);
                    if !nombre.is_empty() && !matches!(Recursos.load(&ruta), Ok(Some(_))) {
                        faltan.push(format!("{nombre} ({})", p.display()));
                    }
                }
            }
        }
        assert!(faltan.is_empty(), "iconos sin embeber: {faltan:?}");
    }
}
