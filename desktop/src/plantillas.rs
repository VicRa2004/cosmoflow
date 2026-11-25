//! Plantillas. Pendiente de implementar: por ahora solo un marcador.

use gpui_kit::*;

pub struct PlantillasView;

impl PlantillasView {
    pub fn new(_: &mut Window, _: &mut Context<Self>) -> Self {
        Self
    }

    pub fn cargar(&mut self, _: &mut Window, _: &mut Context<Self>) {}
}

impl Render for PlantillasView {
    fn render(&mut self, _: &mut Window, _: &mut Context<Self>) -> impl IntoElement {
        div().p_6().child("Plantillas")
    }
}
