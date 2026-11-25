//! Perfil. Pendiente de implementar: por ahora solo un marcador.

use gpui_kit::*;

pub struct PerfilView;

impl PerfilView {
    pub fn new(_: &mut Window, _: &mut Context<Self>) -> Self {
        Self
    }

    pub fn cargar(&mut self, _: &mut Window, _: &mut Context<Self>) {}
}

impl Render for PerfilView {
    fn render(&mut self, _: &mut Window, _: &mut Context<Self>) -> impl IntoElement {
        div().p_6().child("Perfil")
    }
}
