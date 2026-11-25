//! Pestaña de miembros e invitaciones pendientes de una organización.

use gpui_kit::assets::IconName;
use gpui_kit::component::ActiveTheme;
use gpui_kit::component::button::{Button, ButtonVariants as _};
use gpui_kit::component::*;
use gpui_kit::prelude::FluentBuilder as _;
use gpui_kit::*;

use crate::modelos::{InvitacionOrganizacion, MiembroOrganizacion, Organizacion};

use super::OrganizacionesView;
use super::datos::{formatear_fecha_iso, inicial_texto};
use super::formularios::{abrir_dialogo_asignar_roles, abrir_dialogo_invitar};

pub fn render_miembros(
    vista: &OrganizacionesView,
    org: &Organizacion,
    cx: &mut Context<OrganizacionesView>,
) -> AnyElement {
    let org_id = org.id;
    let puede_invitar = org.puede("miembros:invitar");
    let puede_expulsar = org.puede("miembros:expulsar");
    let puede_asignar = org.puede("roles:gestionar");

    let mut filas_miembros = Vec::with_capacity(vista.miembros.len());
    for m in &vista.miembros {
        filas_miembros.push(
            fila_miembro(vista, org, m, puede_asignar, puede_expulsar, cx).into_any_element(),
        );
    }
    let mut filas_inv = Vec::with_capacity(vista.invitaciones.len());
    for inv in &vista.invitaciones {
        filas_inv.push(fila_invitacion(org_id, inv, cx).into_any_element());
    }

    v_flex()
        .id("tab-miembros-org")
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
                        .child(if org.is_admin {
                            "Para salir, primero delega la administración en otro miembro."
                        } else {
                            "Miembros actuales de la organización."
                        }),
                )
                .when(puede_invitar, |row| {
                    row.child(
                        Button::new("invitar-miembro")
                            .small()
                            .icon(IconName::UserPlus)
                            .label("Invitar miembro")
                            .on_click(cx.listener(move |_, _, w, cx| {
                                let weak = cx.entity().downgrade();
                                abrir_dialogo_invitar(org_id, weak, w, cx);
                            })),
                    )
                }),
        )
        .child(v_flex().gap_2().map(|d| {
            if filas_miembros.is_empty() {
                d.child(
                    div()
                        .py_6()
                        .text_sm()
                        .text_color(cx.theme().muted_foreground)
                        .child("No hay miembros cargados en esta organización."),
                )
            } else {
                d.children(filas_miembros)
            }
        }))
        .when(puede_invitar && !filas_inv.is_empty(), |d| {
            d.child(
                v_flex()
                    .pt_2()
                    .gap_2()
                    .child(
                        div()
                            .text_sm()
                            .font_medium()
                            .text_color(cx.theme().muted_foreground)
                            .child("Invitaciones pendientes"),
                    )
                    .children(filas_inv),
            )
        })
        .into_any_element()
}

fn fila_miembro(
    vista: &OrganizacionesView,
    org: &Organizacion,
    m: &MiembroOrganizacion,
    puede_asignar: bool,
    puede_expulsar: bool,
    cx: &mut Context<OrganizacionesView>,
) -> impl IntoElement {
    let uid = m.usuario_id;
    let org_id = org.id;
    let soy_yo = Some(uid) == vista.usuario_actual_id;
    let puede_salir = soy_yo && !m.is_admin;
    let mostrar_asignar = puede_asignar && !m.is_admin;
    let mostrar_delegar = org.is_admin && !soy_yo;
    let mostrar_expulsar = puede_expulsar && !soy_yo && !m.is_admin;

    let mut partes = Vec::new();
    if m.is_admin {
        partes.push("Administrador".to_string());
    }
    if !m.roles.is_empty() {
        let nombres: Vec<&str> = m.roles.iter().map(|r| r.nombre.as_str()).collect();
        partes.push(nombres.join(", "));
    }
    partes.push(m.email.clone());

    let titulo = if soy_yo {
        format!("{} (tú)", m.nombre)
    } else {
        m.nombre.clone()
    };
    let miembro_clone = m.clone();
    let roles = vista.roles.clone();
    let nombre_m = m.nombre.clone();
    let nombre_org = org.nombre.clone();

    h_flex()
        .id(("miembro-org", uid as u64))
        .p_3()
        .gap_3()
        .rounded(cx.theme().radius)
        .border_1()
        .border_color(cx.theme().border)
        .child(
            div()
                .size_8()
                .rounded_full()
                .flex_shrink_0()
                .bg(cx.theme().muted)
                .flex()
                .items_center()
                .justify_center()
                .text_xs()
                .font_semibold()
                .text_color(cx.theme().muted_foreground)
                .child(inicial_texto(&m.nombre, 'U')),
        )
        .child(
            v_flex()
                .flex_1()
                .min_w_0()
                .gap_0p5()
                .child(div().text_sm().font_medium().truncate().child(titulo))
                .child(
                    div()
                        .text_xs()
                        .text_color(cx.theme().muted_foreground)
                        .truncate()
                        .child(partes.join(" · ")),
                ),
        )
        .child(
            h_flex()
                .gap_1()
                .when(mostrar_asignar, |row| {
                    row.child(
                        Button::new(("roles-miembro", uid as u64))
                            .outline()
                            .xsmall()
                            .label("Roles")
                            .on_click(cx.listener(move |_, _, w, cx| {
                                let weak = cx.entity().downgrade();
                                abrir_dialogo_asignar_roles(
                                    org_id,
                                    &miembro_clone,
                                    roles.clone(),
                                    weak,
                                    w,
                                    cx,
                                );
                            })),
                    )
                })
                .when(mostrar_delegar, |row| {
                    let nombre = nombre_m.clone();
                    row.child(
                        Button::new(("delegar-miembro", uid as u64))
                            .outline()
                            .xsmall()
                            .icon(IconName::Crown)
                            .label("Hacer admin")
                            .on_click(cx.listener(move |this, _, w, cx| {
                                this.confirmar_delegar_admin(org_id, uid, &nombre, w, cx);
                            })),
                    )
                })
                .when(puede_salir, |row| {
                    let nombre_org_c = nombre_org.clone();
                    row.child(
                        Button::new(("salir-org", uid as u64))
                            .danger()
                            .xsmall()
                            .icon(IconName::LogOut)
                            .label("Salir")
                            .on_click(cx.listener(move |this, _, w, cx| {
                                this.confirmar_quitar_miembro(
                                    org_id,
                                    uid,
                                    &nombre_org_c,
                                    true,
                                    w,
                                    cx,
                                );
                            })),
                    )
                })
                .when(mostrar_expulsar, |row| {
                    let nombre = nombre_m.clone();
                    row.child(
                        Button::new(("expulsar-miembro", uid as u64))
                            .ghost()
                            .xsmall()
                            .icon(IconName::UserMinus)
                            .tooltip("Expulsar")
                            .on_click(cx.listener(move |this, _, w, cx| {
                                this.confirmar_quitar_miembro(org_id, uid, &nombre, false, w, cx);
                            })),
                    )
                }),
        )
}

fn fila_invitacion(
    org_id: i64,
    inv: &InvitacionOrganizacion,
    cx: &mut Context<OrganizacionesView>,
) -> impl IntoElement {
    let inv_id = inv.id;
    let email = inv.email.clone();
    let email_c = inv.email.clone();
    let subtitulo = if inv.is_caducada {
        "Caducada".to_string()
    } else {
        format!("Caduca: {}", formatear_fecha_iso(&inv.expira_en))
    };

    h_flex()
        .id(("inv-org", inv_id as u64))
        .p_3()
        .gap_3()
        .rounded(cx.theme().radius)
        .border_1()
        .border_color(cx.theme().border)
        .child(
            Icon::new(IconName::Mail)
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
                        .child(inv.email.clone()),
                )
                .child(
                    div()
                        .text_xs()
                        .text_color(if inv.is_caducada {
                            cx.theme().danger
                        } else {
                            cx.theme().muted_foreground
                        })
                        .child(subtitulo),
                ),
        )
        .child(
            h_flex()
                .gap_1()
                .child(
                    Button::new(("reenviar-inv", inv_id as u64))
                        .outline()
                        .xsmall()
                        .icon(IconName::Send)
                        .label("Reenviar")
                        .on_click(cx.listener(move |this, _, w, cx| {
                            this.reenviar_invitacion(org_id, inv_id, &email, w, cx);
                        })),
                )
                .child(
                    Button::new(("cancelar-inv", inv_id as u64))
                        .ghost()
                        .xsmall()
                        .icon(IconName::X)
                        .tooltip("Cancelar invitación")
                        .on_click(cx.listener(move |this, _, w, cx| {
                            this.confirmar_cancelar_invitacion(org_id, inv_id, &email_c, w, cx);
                        })),
                ),
        )
}
