//! Espacio de trabajo: sidebar persistente + sección activa, atajos y paleta de comandos.

use std::rc::Rc;

use gpui_kit::assets::IconName;
use gpui_kit::component::*;
use gpui_kit::component::{
    ActiveTheme,
    button::ButtonVariants as _,
    command::{Command, CommandGroup, CommandItem, CommandState},
    sidebar::{Sidebar, SidebarFooter, SidebarGroup, SidebarHeader, SidebarMenu, SidebarMenuItem},
};
use gpui_kit::*;

use crate::modelos::Usuario;
use crate::notas::NotasView;
use crate::notificaciones::NotificacionesView;
use crate::tareas::TareasView;

actions!(
    cosmoflow,
    [
        IrATareas,
        IrANotas,
        IrANotificaciones,
        AbrirPaleta,
        NuevaTarea,
        Recargar,
        CerrarSesion
    ]
);

const CONTEXTO: &str = "Espacio";

pub fn registrar_atajos(cx: &mut App) {
    let m = if cx.platform_info().is_mac() {
        "cmd"
    } else {
        "ctrl"
    };
    let atajo = |tecla: &str| -> &'static str { format!("{m}-{tecla}").leak() };
    cx.bind_keys([
        KeyBinding::new(atajo("1"), IrATareas, Some(CONTEXTO)),
        KeyBinding::new(atajo("2"), IrANotas, Some(CONTEXTO)),
        KeyBinding::new(atajo("3"), IrANotificaciones, Some(CONTEXTO)),
        KeyBinding::new(atajo("k"), AbrirPaleta, Some(CONTEXTO)),
        KeyBinding::new(atajo("n"), NuevaTarea, Some(CONTEXTO)),
        KeyBinding::new(atajo("r"), Recargar, Some(CONTEXTO)),
    ]);
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum Seccion {
    Tareas,
    Notas,
    Notificaciones,
}

pub enum EventoEspacio {
    SesionCerrada,
}
impl EventEmitter<EventoEspacio> for Espacio {}

type Comando = Rc<dyn Fn(&mut Espacio, &mut Window, &mut Context<Espacio>)>;

pub struct Espacio {
    usuario: Usuario,
    seccion: Seccion,
    tareas: Entity<TareasView>,
    notas: Entity<NotasView>,
    notificaciones: Entity<NotificacionesView>,
    foco: FocusHandle,
}

impl Espacio {
    pub fn new(usuario: Usuario, window: &mut Window, cx: &mut Context<Self>) -> Self {
        let foco = cx.focus_handle();
        foco.focus(window, cx);
        Self {
            usuario,
            seccion: Seccion::Tareas,
            tareas: cx.new(|cx| TareasView::new(window, cx)),
            notas: cx.new(|cx| NotasView::new(window, cx)),
            notificaciones: cx.new(|cx| NotificacionesView::new(window, cx)),
            foco,
        }
    }

    fn ir(&mut self, seccion: Seccion, cx: &mut Context<Self>) {
        self.seccion = seccion;
        cx.notify();
    }

    fn recargar(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        match self.seccion {
            Seccion::Tareas => self.tareas.update(cx, |v, cx| v.cargar(window, cx)),
            Seccion::Notas => self.notas.update(cx, |v, cx| v.cargar(window, cx)),
            Seccion::Notificaciones => self.notificaciones.update(cx, |v, cx| v.cargar(window, cx)),
        }
    }

    fn nueva_tarea(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        self.ir(Seccion::Tareas, cx);
        self.tareas.update(cx, |v, cx| v.abrir_nueva(window, cx));
    }

    fn nueva_nota(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        self.ir(Seccion::Notas, cx);
        self.notas.update(cx, |v, cx| v.abrir_nueva(window, cx));
    }

    fn cerrar_sesion(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        let api = crate::api(cx);
        cx.spawn_in(window, async move |this, cx| {
            cx.background_spawn(async move { api.logout() }).await;
            this.update(cx, |_, cx| cx.emit(EventoEspacio::SesionCerrada))
                .ok();
        })
        .detach();
    }

    fn comandos() -> Vec<(&'static str, IconName, Comando)> {
        vec![
            (
                "Ir a tareas",
                IconName::SquareCheck,
                Rc::new(|e, _, cx| e.ir(Seccion::Tareas, cx)),
            ),
            (
                "Ir a notas",
                IconName::BookOpen,
                Rc::new(|e, _, cx| e.ir(Seccion::Notas, cx)),
            ),
            (
                "Ir a notificaciones",
                IconName::Bell,
                Rc::new(|e, _, cx| e.ir(Seccion::Notificaciones, cx)),
            ),
            (
                "Nueva tarea",
                IconName::Plus,
                Rc::new(|e, w, cx| e.nueva_tarea(w, cx)),
            ),
            (
                "Nueva nota",
                IconName::FilePlus,
                Rc::new(|e, w, cx| e.nueva_nota(w, cx)),
            ),
            (
                "Recargar",
                IconName::RefreshCw,
                Rc::new(|e, w, cx| e.recargar(w, cx)),
            ),
            (
                "Abrir en la web",
                IconName::Globe,
                Rc::new(|_, _, cx| {
                    let _ = open::that_detached(crate::api(cx).url_web());
                }),
            ),
            (
                "Cerrar sesión",
                IconName::LogOut,
                Rc::new(|e, w, cx| e.cerrar_sesion(w, cx)),
            ),
        ]
    }

    fn abrir_paleta(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        let estado = cx.new(|cx| CommandState::new(window, cx));
        let comandos = Self::comandos();
        let espacio = cx.entity().downgrade();
        window.open_dialog(cx, move |dialog, _, _| {
            let comandos = comandos.clone();
            let espacio = espacio.clone();
            // Los comandos se ejecutan en on_confirm: el diálogo no está dentro del árbol
            // del espacio, así que una Action despachada desde aquí no le llegaría.
            let grupo = CommandGroup::new().label("Comandos").items(
                comandos
                    .iter()
                    .map(|(t, i, _)| CommandItem::new().label(*t).icon(*i)),
            );
            dialog.w(px(480.)).p_0().close_button(false).child(
                Command::new(&estado)
                    .group(grupo)
                    .placeholder("Escribe un comando…")
                    .max_h(px(360.))
                    .on_cancel(|window, cx| window.close_dialog(cx))
                    .on_confirm(move |indice, window, cx| {
                        window.close_dialog(cx);
                        if let Some((_, _, comando)) = comandos.get(indice.row) {
                            let comando = comando.clone();
                            espacio.update(cx, |e, cx| comando(e, window, cx)).ok();
                        }
                    }),
            )
        });
    }
}

impl Render for Espacio {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let item =
            |etiqueta: &'static str, icono: IconName, seccion: Seccion, cx: &mut Context<Self>| {
                let espacio = cx.entity().downgrade();
                SidebarMenuItem::new(etiqueta)
                    .icon(icono)
                    .active(self.seccion == seccion)
                    .on_click(move |_, _, cx| {
                        espacio.update(cx, |e, cx| e.ir(seccion, cx)).ok();
                    })
            };
        let menu = SidebarMenu::new().children([
            item("Tareas", IconName::SquareCheck, Seccion::Tareas, cx),
            item("Notas", IconName::BookOpen, Seccion::Notas, cx),
            item(
                "Notificaciones",
                IconName::Bell,
                Seccion::Notificaciones,
                cx,
            ),
        ]);
        let espacio = cx.entity().downgrade();
        let contenido: AnyElement = match self.seccion {
            Seccion::Tareas => self.tareas.clone().into_any_element(),
            Seccion::Notas => self.notas.clone().into_any_element(),
            Seccion::Notificaciones => self.notificaciones.clone().into_any_element(),
        };

        h_flex()
            .id("espacio")
            .size_full()
            .track_focus(&self.foco)
            .key_context(CONTEXTO)
            .on_action(cx.listener(|e, _: &IrATareas, _, cx| e.ir(Seccion::Tareas, cx)))
            .on_action(cx.listener(|e, _: &IrANotas, _, cx| e.ir(Seccion::Notas, cx)))
            .on_action(
                cx.listener(|e, _: &IrANotificaciones, _, cx| e.ir(Seccion::Notificaciones, cx)),
            )
            .on_action(cx.listener(|e, _: &AbrirPaleta, w, cx| e.abrir_paleta(w, cx)))
            .on_action(cx.listener(|e, _: &NuevaTarea, w, cx| e.nueva_tarea(w, cx)))
            .on_action(cx.listener(|e, _: &Recargar, w, cx| e.recargar(w, cx)))
            .on_action(cx.listener(|e, _: &CerrarSesion, w, cx| e.cerrar_sesion(w, cx)))
            .child(
                Sidebar::new("navegacion")
                    .w(px(232.))
                    .header(SidebarHeader::new().child(div().font_semibold().child("Cosmoflow")))
                    .child(SidebarGroup::new("Espacio").child(menu))
                    .footer(
                        SidebarFooter::new().child(
                            h_flex()
                                .w_full()
                                .gap_2()
                                .child(
                                    v_flex()
                                        .flex_1()
                                        .min_w_0()
                                        .child(
                                            div()
                                                .text_sm()
                                                .truncate()
                                                .child(self.usuario.nombre.clone()),
                                        )
                                        .child(
                                            div()
                                                .text_xs()
                                                .truncate()
                                                .text_color(cx.theme().muted_foreground)
                                                .child(self.usuario.email.clone()),
                                        ),
                                )
                                .child(
                                    button::Button::new("cerrar-sesion")
                                        .icon(IconName::LogOut)
                                        .ghost()
                                        .small()
                                        .tooltip("Cerrar sesión")
                                        .on_click(move |_, window, cx| {
                                            espacio
                                                .update(cx, |e, cx| e.cerrar_sesion(window, cx))
                                                .ok();
                                        }),
                                ),
                        ),
                    ),
            )
            .child(div().flex_1().min_w_0().h_full().child(contenido))
    }
}
