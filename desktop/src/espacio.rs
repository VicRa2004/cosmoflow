//! Espacio de trabajo: sidebar persistente + sección activa, atajos y paleta de comandos.

use std::rc::Rc;

use gpui_kit::assets::IconName;
use gpui_kit::component::*;
use gpui_kit::component::{
    ActiveTheme,
    badge::Badge,
    button::ButtonVariants as _,
    command::{Command, CommandGroup, CommandItem, CommandState},
    sidebar::{Sidebar, SidebarFooter, SidebarGroup, SidebarHeader, SidebarMenu, SidebarMenuItem},
};
use gpui_kit::prelude::FluentBuilder as _;
use gpui_kit::*;

use crate::calendario::CalendarioView;
use crate::inicio::InicioView;
use crate::modelos::Usuario;
use crate::notas::NotasView;
use crate::notificaciones::{EventoNotificaciones, NotificacionesView};
use crate::organizaciones::OrganizacionesView;
use crate::perfil::{EventoPerfil, PerfilView};
use crate::plantillas::PlantillasView;
use crate::tags::TagsView;
use crate::tareas::TareasView;

actions!(
    cosmoflow,
    [
        IrAInicio,
        IrATareas,
        IrANotas,
        IrACalendario,
        IrAOrganizaciones,
        IrANotificaciones,
        IrAPerfil,
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
        KeyBinding::new(atajo("1"), IrAInicio, Some(CONTEXTO)),
        KeyBinding::new(atajo("2"), IrATareas, Some(CONTEXTO)),
        KeyBinding::new(atajo("3"), IrANotas, Some(CONTEXTO)),
        KeyBinding::new(atajo("4"), IrACalendario, Some(CONTEXTO)),
        KeyBinding::new(atajo("5"), IrAOrganizaciones, Some(CONTEXTO)),
        KeyBinding::new(atajo("6"), IrANotificaciones, Some(CONTEXTO)),
        KeyBinding::new(atajo(","), IrAPerfil, Some(CONTEXTO)),
        KeyBinding::new(atajo("k"), AbrirPaleta, Some(CONTEXTO)),
        KeyBinding::new(atajo("n"), NuevaTarea, Some(CONTEXTO)),
        KeyBinding::new(atajo("r"), Recargar, Some(CONTEXTO)),
    ]);
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum Seccion {
    Inicio,
    Tareas,
    Notas,
    Calendario,
    Organizaciones,
    Notificaciones,
    Tags,
    Plantillas,
    Perfil,
}

pub enum EventoEspacio {
    SesionCerrada,
}
impl EventEmitter<EventoEspacio> for Espacio {}

type Comando = Rc<dyn Fn(&mut Espacio, &mut Window, &mut Context<Espacio>)>;

pub struct Espacio {
    usuario: Usuario,
    seccion: Seccion,
    inicio: Entity<InicioView>,
    tareas: Entity<TareasView>,
    notas: Entity<NotasView>,
    calendario: Entity<CalendarioView>,
    organizaciones: Entity<OrganizacionesView>,
    notificaciones: Entity<NotificacionesView>,
    tags: Entity<TagsView>,
    plantillas: Entity<PlantillasView>,
    perfil: Entity<PerfilView>,
    no_leidas: usize,
    foco: FocusHandle,
    _suscripciones: Vec<Subscription>,
}

impl Espacio {
    pub fn new(usuario: Usuario, window: &mut Window, cx: &mut Context<Self>) -> Self {
        let foco = cx.focus_handle();
        foco.focus(window, cx);
        let notificaciones = cx.new(|cx| NotificacionesView::new(window, cx));
        let no_leidas = notificaciones.read(cx).no_leidas();
        let sub_notifs = cx.subscribe(
            &notificaciones,
            |this, _, evento: &EventoNotificaciones, cx| {
                if this.no_leidas != evento.no_leidas {
                    this.no_leidas = evento.no_leidas;
                    cx.notify();
                }
            },
        );
        let perfil = cx.new(|cx| PerfilView::new(window, cx));
        let sub_perfil = cx.subscribe(&perfil, |_, _, evento: &EventoPerfil, cx| match evento {
            EventoPerfil::SesionCerrada => cx.emit(EventoEspacio::SesionCerrada),
        });
        // shortcut: todas las vistas se crean (y cargan) al entrar; hacerlas perezosas si el arranque pesa.
        Self {
            usuario,
            seccion: Seccion::Inicio,
            inicio: cx.new(|cx| InicioView::new(window, cx)),
            tareas: cx.new(|cx| TareasView::new(window, cx)),
            notas: cx.new(|cx| NotasView::new(window, cx)),
            calendario: cx.new(|cx| CalendarioView::new(window, cx)),
            organizaciones: cx.new(|cx| OrganizacionesView::new(window, cx)),
            notificaciones,
            tags: cx.new(|cx| TagsView::new(window, cx)),
            plantillas: cx.new(|cx| PlantillasView::new(window, cx)),
            perfil,
            no_leidas,
            foco,
            _suscripciones: vec![sub_notifs, sub_perfil],
        }
    }

    fn ir(&mut self, seccion: Seccion, cx: &mut Context<Self>) {
        self.seccion = seccion;
        cx.notify();
    }

    fn recargar(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        match self.seccion {
            Seccion::Inicio => self.inicio.update(cx, |v, cx| v.cargar(window, cx)),
            Seccion::Tareas => self.tareas.update(cx, |v, cx| v.cargar(window, cx)),
            Seccion::Notas => self.notas.update(cx, |v, cx| v.cargar(window, cx)),
            Seccion::Calendario => self.calendario.update(cx, |v, cx| v.cargar(window, cx)),
            Seccion::Organizaciones => self.organizaciones.update(cx, |v, cx| v.cargar(window, cx)),
            Seccion::Notificaciones => self.notificaciones.update(cx, |v, cx| v.cargar(window, cx)),
            Seccion::Tags => self.tags.update(cx, |v, cx| v.cargar(window, cx)),
            Seccion::Plantillas => self.plantillas.update(cx, |v, cx| v.cargar(window, cx)),
            Seccion::Perfil => self.perfil.update(cx, |v, cx| v.cargar(window, cx)),
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
        let ir = |etiqueta, icono, seccion: Seccion| -> (&'static str, IconName, Comando) {
            (etiqueta, icono, Rc::new(move |e, _, cx| e.ir(seccion, cx)))
        };
        vec![
            ir("Ir a inicio", IconName::House, Seccion::Inicio),
            ir("Ir a calendario", IconName::Calendar, Seccion::Calendario),
            ir(
                "Ir a organizaciones",
                IconName::Building2,
                Seccion::Organizaciones,
            ),
            ir("Ir a tags", IconName::Tag, Seccion::Tags),
            ir(
                "Ir a plantillas",
                IconName::LayoutTemplate,
                Seccion::Plantillas,
            ),
            ir("Ir a perfil", IconName::User, Seccion::Perfil),
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
        let no_leidas = self.no_leidas;
        let menu = SidebarMenu::new().children([
            item("Inicio", IconName::House, Seccion::Inicio, cx),
            item("Tareas", IconName::SquareCheck, Seccion::Tareas, cx),
            item("Notas", IconName::BookOpen, Seccion::Notas, cx),
            item("Calendario", IconName::Calendar, Seccion::Calendario, cx),
            item(
                "Organizaciones",
                IconName::Building2,
                Seccion::Organizaciones,
                cx,
            ),
            item(
                "Notificaciones",
                IconName::Bell,
                Seccion::Notificaciones,
                cx,
            )
            .when(no_leidas > 0, |it| {
                it.suffix(move |_, _| {
                    div()
                        .pr_2p5()
                        .child(Badge::new().count(no_leidas).child(div().w_4().h_3()))
                })
            }),
        ]);
        let biblioteca = SidebarMenu::new().children([
            item("Tags", IconName::Tag, Seccion::Tags, cx),
            item(
                "Plantillas",
                IconName::LayoutTemplate,
                Seccion::Plantillas,
                cx,
            ),
            item("Perfil", IconName::User, Seccion::Perfil, cx),
        ]);
        let espacio = cx.entity().downgrade();
        let contenido: AnyElement = match self.seccion {
            Seccion::Inicio => self.inicio.clone().into_any_element(),
            Seccion::Tareas => self.tareas.clone().into_any_element(),
            Seccion::Notas => self.notas.clone().into_any_element(),
            Seccion::Calendario => self.calendario.clone().into_any_element(),
            Seccion::Organizaciones => self.organizaciones.clone().into_any_element(),
            Seccion::Notificaciones => self.notificaciones.clone().into_any_element(),
            Seccion::Tags => self.tags.clone().into_any_element(),
            Seccion::Plantillas => self.plantillas.clone().into_any_element(),
            Seccion::Perfil => self.perfil.clone().into_any_element(),
        };

        h_flex()
            .id("espacio")
            .size_full()
            .track_focus(&self.foco)
            .key_context(CONTEXTO)
            .on_action(cx.listener(|e, _: &IrAInicio, _, cx| e.ir(Seccion::Inicio, cx)))
            .on_action(cx.listener(|e, _: &IrATareas, _, cx| e.ir(Seccion::Tareas, cx)))
            .on_action(cx.listener(|e, _: &IrANotas, _, cx| e.ir(Seccion::Notas, cx)))
            .on_action(cx.listener(|e, _: &IrACalendario, _, cx| e.ir(Seccion::Calendario, cx)))
            .on_action(
                cx.listener(|e, _: &IrAOrganizaciones, _, cx| e.ir(Seccion::Organizaciones, cx)),
            )
            .on_action(cx.listener(|e, _: &IrAPerfil, _, cx| e.ir(Seccion::Perfil, cx)))
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
                    .child(SidebarGroup::new("Biblioteca").child(biblioteca))
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
                                                .text_color(
                                                    cx.theme().sidebar_foreground.opacity(0.7),
                                                )
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
