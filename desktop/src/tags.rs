//! Tags. Pendiente de implementar: por ahora solo un marcador.

use gpui_kit::*;

pub struct TagsView;

impl TagsView {
    pub fn new(_: &mut Window, _: &mut Context<Self>) -> Self {
        Self
    }

    pub fn cargar(&mut self, _: &mut Window, _: &mut Context<Self>) {}
}

impl Render for TagsView {
    fn render(&mut self, _: &mut Window, _: &mut Context<Self>) -> impl IntoElement {
        div().p_6().child("Tags")
    }
}
