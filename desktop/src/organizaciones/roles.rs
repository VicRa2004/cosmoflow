//! Pestaña de roles personalizados de una organización (`roles:gestionar`).

use gpui_kit::assets::IconName;
use gpui_kit::component::ActiveTheme;
use gpui_kit::component::button::{Button, ButtonVariants as _};
use gpui_kit::component::*;
use gpui_kit::prelude::FluentBuilder as _;
use gpui_kit::*;

use crate::modelos::{CatalogoPermisosOrganizacion, Organizacion};

use super::OrganizacionesView;
use super::formularios::abrir_dialogo_rol;

pub fn render_roles(
    vista: &OrganizacionesView,
    org: &Organizacion,
    cx: &mut Context<OrganizacionesView>,
) -> AnyElement {
    let org_id = org.id;
    let catalogo = vista
        .catalogo_permisos
        .clone()
        .unwrap_or(CatalogoPermisosOrganizacion {
            permisos: vec![],
            plantillas: vec![],
        });
    let catalogo_nuevo = catalogo.clone();

    v_flex()
        .id("tab-roles-org")
        .size_full()
        .overflow_y_scroll()
        .p_6()
        .gap_4()
        .child(
            h_flex()
                .justify_between()
                .gap_2()
                .child(
                    div()
                        .text_xs()
                        .text_color(cx.theme().muted_foreground)
                        .child("Opcionales. Dan permisos a los miembros; el administrador ya los tiene todos."),
                )
                .child(
                    Button::new("nuevo-rol-org")
                        .small()
                        .icon(IconName::Plus)
                        .label("Nuevo rol")
                        .on_click(cx.listener(move |_, _, w, cx| {
                            let weak = cx.entity().downgrade();
                            abrir_dialogo_rol(org_id, None, catalogo_nuevo.clone(), weak, w, cx);
                        })),
                ),
        )
        .child(v_flex().gap_2().map(|d| {
            if vista.roles.is_empty() {
                d.child(
                    div()
                        .py_8()
                        .text_sm()
                        .text_color(cx.theme().muted_foreground)
                        .child("Sin roles. Crea un rol para delegar permisos concretos."),
                )
            } else {
                d.children(vista.roles.iter().map(|rol| {
                    let rid = rol.id;
                    let n_perm = rol.permisos.len();
                    let n_m = rol.total_miembros;
                    let subtitulo = format!(
                        "{n_perm} {} · {n_m} {}",
                        if n_perm == 1 { "permiso" } else { "permisos" },
                        if n_m == 1 { "miembro" } else { "miembros" },
                    );
                    let rol_clone = rol.clone();
                    let cat_edit = catalogo.clone();
                    let nombre_r = rol.nombre.clone();

                    h_flex()
                        .id(("rol-org", rid as u64))
                        .p_3()
                        .gap_3()
                        .rounded(cx.theme().radius)
                        .border_1()
                        .border_color(cx.theme().border)
                        .child(
                            Icon::new(IconName::Shield)
                                .small()
                                .text_color(cx.theme().muted_foreground),
                        )
                        .child(
                            v_flex()
                                .flex_1()
                                .min_w_0()
                                .gap_0p5()
                                .child(
                                    div()
                                        .text_sm()
                                        .font_medium()
                                        .truncate()
                                        .child(rol.nombre.clone()),
                                )
                                .child(
                                    div()
                                        .text_xs()
                                        .text_color(cx.theme().muted_foreground)
                                        .child(subtitulo),
                                ),
                        )
                        .child(
                            h_flex()
                                .gap_1()
                                .child(
                                    Button::new(("editar-rol", rid as u64))
                                        .outline()
                                        .xsmall()
                                        .icon(IconName::Pencil)
                                        .label("Editar")
                                        .on_click(cx.listener(move |_, _, w, cx| {
                                            let weak = cx.entity().downgrade();
                                            abrir_dialogo_rol(
                                                org_id,
                                                Some(rol_clone.clone()),
                                                cat_edit.clone(),
                                                weak,
                                                w,
                                                cx,
                                            );
                                        })),
                                )
                                .child(
                                    Button::new(("eliminar-rol", rid as u64))
                                        .ghost()
                                        .xsmall()
                                        .icon(IconName::Delete)
                                        .tooltip("Eliminar rol")
                                        .on_click(cx.listener(move |this, _, w, cx| {
                                            this.confirmar_eliminar_rol(
                                                org_id,
                                                rid,
                                                &nombre_r,
                                                w,
                                                cx,
                                            );
                                        })),
                                ),
                        )
                }))
            }
        }))
        .into_any_element()
}
