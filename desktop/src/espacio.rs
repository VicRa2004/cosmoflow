//! Espacio de trabajo: sidebar persistente + sección activa, atajos y paleta de comandos.

use std::rc::Rc;

use gpui_kit::assets::IconName;
use gpui_kit::component::*;
use gpui_kit::component::{
    ActiveTheme,
    badge::Badge,
    button::ButtonVariants as _,
    command::{Command, CommandGroup, CommandItem, CommandState},
    kbd::Kbd,
    menu::{DropdownMenu as _, PopupMenuItem},
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
        IrAConfiguracion,
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
        KeyBinding::new(atajo(","), IrAConfiguracion, Some(CONTEXTO)),
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
    Configuracion,
}

impl Seccion {
    /// Perfil y Configuración ocupan toda la ventana (sin el sidebar de la app).
    fn es_ajustes(self) -> bool {
        matches!(self, Self::Perfil | Self::Configuracion)
    }
}

pub enum EventoEspacio {
    SesionCerrada,
}
impl EventEmitter<EventoEspacio> for Espacio {}

type Comando = Rc<dyn Fn(&mut Espacio, &mut Window, &mut Context<Espacio>)>;

pub struct Espacio {
    usuario: Usuario,
    seccion: Seccion,
    /// Adónde vuelve «Volver» desde Perfil/Configuración.
    seccion_previa: Seccion,
    // Inicio y notificaciones (contador de la campana) se crean al entrar; el resto, al visitarlas.
    inicio: Entity<InicioView>,
    notificaciones: Entity<NotificacionesView>,
    tareas: Option<Entity<TareasView>>,
    notas: Option<Entity<NotasView>>,
    calendario: Option<Entity<CalendarioView>>,
    organizaciones: Option<Entity<OrganizacionesView>>,
    tags: Option<Entity<TagsView>>,
    plantillas: Option<Entity<PlantillasView>>,
    perfil: Option<Entity<PerfilView>>,
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
        Self {
            usuario,
            seccion: Seccion::Inicio,
            seccion_previa: Seccion::Inicio,
            inicio: cx.new(|cx| InicioView::new(window, cx)),
            notificaciones,
            tareas: None,
            notas: None,
            calendario: None,
            organizaciones: None,
            tags: None,
            plantillas: None,
            perfil: None,
            no_leidas,
            foco,
            _suscripciones: vec![sub_notifs],
        }
    }

    /// Devuelve la vista de la ranura y la crea (y carga) la primera vez que se pide.
    fn vista<V: 'static>(
        ranura: &mut Option<Entity<V>>,
        window: &mut Window,
        cx: &mut Context<Self>,
        crear: impl FnOnce(&mut Window, &mut Context<V>) -> V,
    ) -> Entity<V> {
        ranura
            .get_or_insert_with(|| cx.new(|cx| crear(window, cx)))
            .clone()
    }

    fn tareas(&mut self, window: &mut Window, cx: &mut Context<Self>) -> Entity<TareasView> {
        Self::vista(&mut self.tareas, window, cx, TareasView::new)
    }

    fn notas(&mut self, window: &mut Window, cx: &mut Context<Self>) -> Entity<NotasView> {
        Self::vista(&mut self.notas, window, cx, NotasView::new)
    }

    fn calendario(
        &mut self,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) -> Entity<CalendarioView> {
        Self::vista(&mut self.calendario, window, cx, CalendarioView::new)
    }

    fn tags(&mut self, window: &mut Window, cx: &mut Context<Self>) -> Entity<TagsView> {
        Self::vista(&mut self.tags, window, cx, TagsView::new)
    }

    fn plantillas(
        &mut self,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) -> Entity<PlantillasView> {
        Self::vista(&mut self.plantillas, window, cx, PlantillasView::new)
    }

    fn organizaciones(
        &mut self,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) -> Entity<OrganizacionesView> {
        let usuario = self.usuario.id;
        Self::vista(&mut self.organizaciones, window, cx, |window, cx| {
            let mut v = OrganizacionesView::new(window, cx);
            v.establecer_usuario(usuario, cx);
            v
        })
    }

    fn perfil(&mut self, window: &mut Window, cx: &mut Context<Self>) -> Entity<PerfilView> {
        if let Some(perfil) = &self.perfil {
            return perfil.clone();
        }
        let configuracion = self.seccion == Seccion::Configuracion;
        let perfil = cx.new(|cx| {
            let mut v = PerfilView::new(window, cx);
            v.mostrar_configuracion(configuracion, cx);
            v
        });
        self._suscripciones
            .push(
                cx.subscribe(&perfil, |_, _, evento: &EventoPerfil, cx| match evento {
                    EventoPerfil::SesionCerrada => cx.emit(EventoEspacio::SesionCerrada),
                }),
            );
        self.perfil = Some(perfil.clone());
        perfil
    }

    fn ir(&mut self, seccion: Seccion, cx: &mut Context<Self>) {
        if seccion.es_ajustes()
            && let Some(perfil) = &self.perfil
        {
            perfil.update(cx, |v, cx| {
                v.mostrar_configuracion(seccion == Seccion::Configuracion, cx)
            });
        }
        if !self.seccion.es_ajustes() {
            self.seccion_previa = self.seccion;
        }
        self.seccion = seccion;
        cx.notify();
    }

    fn recargar(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        match self.seccion {
            Seccion::Inicio => self.inicio.update(cx, |v, cx| v.cargar(window, cx)),
            Seccion::Tareas => self
                .tareas(window, cx)
                .update(cx, |v, cx| v.cargar(window, cx)),
            Seccion::Notas => self
                .notas(window, cx)
                .update(cx, |v, cx| v.cargar(window, cx)),
            Seccion::Calendario => self
                .calendario(window, cx)
                .update(cx, |v, cx| v.cargar(window, cx)),
            Seccion::Organizaciones => self
                .organizaciones(window, cx)
                .update(cx, |v, cx| v.cargar(window, cx)),
            Seccion::Notificaciones => self.notificaciones.update(cx, |v, cx| v.cargar(window, cx)),
            Seccion::Tags => self
                .tags(window, cx)
                .update(cx, |v, cx| v.cargar(window, cx)),
            Seccion::Plantillas => self
                .plantillas(window, cx)
                .update(cx, |v, cx| v.cargar(window, cx)),
            Seccion::Perfil | Seccion::Configuracion => self
                .perfil(window, cx)
                .update(cx, |v, cx| v.cargar(window, cx)),
        }
    }

    fn nueva_tarea(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        self.ir(Seccion::Tareas, cx);
        self.tareas(window, cx)
            .update(cx, |v, cx| v.abrir_nueva(window, cx));
    }

    fn nueva_nota(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        self.ir(Seccion::Notas, cx);
        self.notas(window, cx)
            .update(cx, |v, cx| v.abrir_nueva(window, cx));
    }

    fn nueva_organizacion(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        self.ir(Seccion::Organizaciones, cx);
        self.organizaciones(window, cx)
            .update(cx, |v, cx| v.abrir_nueva(window, cx));
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
            ir("Ir a inicio", IconName::CircleDot, Seccion::Inicio),
            ir(
                "Ir a calendario",
                IconName::CalendarDays,
                Seccion::Calendario,
            ),
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
            ir(
                "Ir a configuración",
                IconName::Settings,
                Seccion::Configuracion,
            ),
            (
                "Ir a tareas",
                IconName::ListTodo,
                Rc::new(|e, _, cx| e.ir(Seccion::Tareas, cx)),
            ),
            (
                "Ir a notas",
                IconName::StickyNote,
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
                "Nueva organización",
                IconName::Building2,
                Rc::new(|e, w, cx| e.nueva_organizacion(w, cx)),
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
    fn render(&mut self, window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
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
        // Mismos grupos, nombres de icono y orden que el menú lateral de la web.
        let personal = SidebarMenu::new().children([
            item("Inicio", IconName::CircleDot, Seccion::Inicio, cx),
            item("Tareas", IconName::ListTodo, Seccion::Tareas, cx),
            item(
                "Calendario",
                IconName::CalendarDays,
                Seccion::Calendario,
                cx,
            ),
            item("Notas", IconName::StickyNote, Seccion::Notas, cx),
            item("Tags", IconName::Tag, Seccion::Tags, cx),
            item(
                "Plantillas",
                IconName::LayoutTemplate,
                Seccion::Plantillas,
                cx,
            ),
        ]);
        let colaboracion = SidebarMenu::new().children([item(
            "Organizaciones",
            IconName::Building2,
            Seccion::Organizaciones,
            cx,
        )]);
        let contenido: AnyElement = match self.seccion {
            Seccion::Inicio => self.inicio.clone().into_any_element(),
            Seccion::Tareas => self.tareas(window, cx).into_any_element(),
            Seccion::Notas => self.notas(window, cx).into_any_element(),
            Seccion::Calendario => self.calendario(window, cx).into_any_element(),
            Seccion::Organizaciones => self.organizaciones(window, cx).into_any_element(),
            Seccion::Notificaciones => self.notificaciones.clone().into_any_element(),
            Seccion::Tags => self.tags(window, cx).into_any_element(),
            Seccion::Plantillas => self.plantillas(window, cx).into_any_element(),
            Seccion::Perfil | Seccion::Configuracion => self.perfil(window, cx).into_any_element(),
        };
        let ajustes = self.seccion.es_ajustes();

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
                cx.listener(|e, _: &IrAConfiguracion, _, cx| e.ir(Seccion::Configuracion, cx)),
            )
            .on_action(
                cx.listener(|e, _: &IrANotificaciones, _, cx| e.ir(Seccion::Notificaciones, cx)),
            )
            .on_action(cx.listener(|e, _: &AbrirPaleta, w, cx| e.abrir_paleta(w, cx)))
            .on_action(cx.listener(|e, _: &NuevaTarea, w, cx| e.nueva_tarea(w, cx)))
            .on_action(cx.listener(|e, _: &Recargar, w, cx| e.recargar(w, cx)))
            .on_action(cx.listener(|e, _: &CerrarSesion, w, cx| e.cerrar_sesion(w, cx)))
            .when(!ajustes, |d| {
                d.child(
                    Sidebar::new("navegacion")
                        .w(px(232.))
                        .header(
                            SidebarHeader::new()
                                // macOS pinta los semáforos encima del sidebar.
                                .when(cfg!(target_os = "macos"), |h| h.mt_6())
                                .child(
                                    h_flex().gap_2p5().child(marca(cx)).child(
                                        div()
                                            .text_color(cx.theme().sidebar_accent_foreground)
                                            .font_semibold()
                                            .child("Cosmoflow"),
                                    ),
                                ),
                        )
                        .child(SidebarGroup::new("Personal").child(personal))
                        .child(SidebarGroup::new("Colaboración").child(colaboracion))
                        .footer(SidebarFooter::new().child(self.menu_usuario(cx))),
                )
            })
            .child(
                v_flex()
                    .flex_1()
                    .min_w_0()
                    .h_full()
                    .child(self.barra_superior(window, cx))
                    .child(div().flex_1().min_h_0().child(contenido)),
            )
    }
}

/// Isotipo de la web (`Marca.tsx`): hexágono blanco sobre un cuadrado índigo.
fn marca(cx: &App) -> impl IntoElement {
    div()
        .size_7()
        .flex_shrink_0()
        .flex()
        .items_center()
        .justify_center()
        .rounded(cx.theme().radius)
        .bg(cx.theme().primary)
        .text_color(cx.theme().primary_foreground)
        .child(Icon::new(IconName::Hexagon).small())
}

impl Espacio {
    /// Nombre y email en el pie del sidebar; al pulsar abre Perfil, Configuración y Cerrar sesión.
    fn menu_usuario(&self, cx: &mut Context<Self>) -> impl IntoElement {
        let espacio = cx.entity().downgrade();
        // `ghost` usa el `accent` de la página (casi blanco en modo claro); el sidebar siempre es oscuro.
        let tema = cx.theme();
        let colores = button::ButtonCustomVariant::new(cx)
            .color(tema.transparent)
            .foreground(tema.sidebar_foreground)
            .hover(tema.sidebar_accent)
            .active(tema.sidebar_accent);
        button::Button::new("menu-usuario")
            .custom(colores)
            .w_full()
            .child(
                h_flex()
                    .w_full()
                    .gap_2()
                    .child(
                        v_flex()
                            .flex_1()
                            .min_w_0()
                            .items_start()
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
                                    .text_color(cx.theme().sidebar_foreground.opacity(0.7))
                                    .child(self.usuario.email.clone()),
                            ),
                    )
                    .child(Icon::new(IconName::ChevronsUpDown).small()),
            )
            .dropdown_menu_with_anchor(Anchor::BottomLeft, move |menu, _, _| {
                let opcion = |etiqueta: &'static str, icono: IconName, seccion: Seccion| {
                    let espacio = espacio.clone();
                    PopupMenuItem::new(etiqueta)
                        .icon(icono)
                        .on_click(move |_, _, cx| {
                            espacio.update(cx, |e, cx| e.ir(seccion, cx)).ok();
                        })
                };
                let espacio = espacio.clone();
                menu.min_w(px(200.))
                    .item(opcion("Perfil", IconName::User, Seccion::Perfil))
                    .item(opcion(
                        "Configuración",
                        IconName::Settings,
                        Seccion::Configuracion,
                    ))
                    .separator()
                    .item(
                        PopupMenuItem::new("Cerrar sesión")
                            .icon(IconName::LogOut)
                            .on_click(move |_, window, cx| {
                                espacio.update(cx, |e, cx| e.cerrar_sesion(window, cx)).ok();
                            }),
                    )
            })
    }

    /// Equivale al `Navbar` de la web: búsqueda (paleta) y campana, alineadas a la derecha.
    fn barra_superior(&self, window: &Window, cx: &mut Context<Self>) -> impl IntoElement {
        let no_leidas = self.no_leidas;
        let ajustes = self.seccion.es_ajustes();
        TitleBar::new()
            .when(ajustes, |t| {
                t.child(
                    button::Button::new("volver")
                        .ghost()
                        .small()
                        .icon(IconName::ArrowLeft)
                        .label("Volver")
                        .on_click(cx.listener(|e, _, _, cx| e.ir(e.seccion_previa, cx))),
                )
            })
            .child(
                h_flex()
                    .flex_1()
                    .justify_end()
                    .gap_1()
                    .pr_2()
                    .child(
                        button::Button::new("abrir-paleta")
                            .ghost()
                            .small()
                            .icon(IconName::Search)
                            .label("Ir a…")
                            .when_some(
                                Kbd::binding_for_action_in(&AbrirPaleta, &self.foco, window),
                                |b, kbd| b.child(kbd),
                            )
                            .on_click(cx.listener(|e, _, w, cx| e.abrir_paleta(w, cx))),
                    )
                    .child(
                        button::Button::new("ir-notificaciones")
                            .ghost()
                            .small()
                            .icon(IconName::Bell)
                            .tooltip("Notificaciones")
                            .when(no_leidas > 0, |b| {
                                b.child(Badge::new().count(no_leidas).child(div()))
                            })
                            .on_click(cx.listener(|e, _, _, cx| e.ir(Seccion::Notificaciones, cx))),
                    ),
            )
    }
}
