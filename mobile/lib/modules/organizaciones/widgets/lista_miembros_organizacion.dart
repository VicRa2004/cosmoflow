import 'package:flutter/material.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/avisos.dart';
import '../../../core/widgets/confirmar.dart';
import '../../../core/widgets/estados.dart';
import '../api/organizaciones_api.dart';
import '../models/organizacion_models.dart';
import 'asignar_roles_sheet.dart';
import 'invitar_sheet.dart';

/// Pestaña de miembros e invitaciones pendientes de una organización.
class ListaMiembrosOrganizacion extends StatelessWidget {
  const ListaMiembrosOrganizacion({
    super.key,
    required this.organizacion,
    required this.miembros,
    required this.invitaciones,
    required this.roles,
    required this.usuarioActualId,
    required this.organizacionesApi,
    required this.onRefresh,
    required this.onSalirOrganizacion,
  });

  final OrganizacionDto organizacion;
  final List<MiembroDto> miembros;
  final List<InvitacionDto> invitaciones;
  final List<RolOrganizacionDto> roles;
  final int? usuarioActualId;
  final OrganizacionesApi organizacionesApi;
  final Future<void> Function() onRefresh;
  final VoidCallback onSalirOrganizacion;

  Future<void> _invitar(BuildContext context) async {
    final email = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => const InvitarSheet(),
    );
    if (email == null || !context.mounted) return;
    final ok = await ejecutarConAviso(
      context,
      () => organizacionesApi.invitar(organizacion.id, email),
      error: 'No se pudo enviar la invitación.',
      exito: 'Invitación enviada a $email',
    );
    if (ok) await onRefresh();
  }

  Future<void> _asignarRoles(BuildContext context, MiembroDto miembro) async {
    final rolIds = await showModalBottomSheet<List<int>>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => AsignarRolesSheet(miembro: miembro, roles: roles),
    );
    if (rolIds == null || !context.mounted) return;
    final ok = await ejecutarConAviso(
      context,
      () => organizacionesApi.asignarRoles(
        organizacion.id,
        miembro.usuarioId,
        rolIds,
      ),
      error: 'No se pudieron actualizar los roles.',
      exito: 'Roles actualizados',
    );
    if (ok) await onRefresh();
  }

  Future<void> _delegarAdmin(BuildContext context, MiembroDto miembro) async {
    final ok = await confirmar(
      context,
      titulo: '¿Hacer administrador a ${miembro.nombre}?',
      mensaje: 'Solo hay un administrador: tú pasarás a ser un miembro normal.',
      accion: 'Delegar',
    );
    if (!ok || !context.mounted) return;
    final hecho = await ejecutarConAviso(
      context,
      () => organizacionesApi.delegarAdmin(organizacion.id, miembro.usuarioId),
      error: 'No se pudo delegar la administración.',
      exito: '${miembro.nombre} es ahora el administrador',
    );
    if (hecho) await onRefresh();
  }

  Future<void> _quitarMiembro(
    BuildContext context,
    MiembroDto miembro, {
    required bool esSalir,
  }) async {
    final ok = await confirmar(
      context,
      titulo: esSalir
          ? '¿Salir de la organización?'
          : '¿Expulsar a ${miembro.nombre}?',
      mensaje: esSalir
          ? 'Dejarás de ver «${organizacion.nombre}». Para volver necesitarás otra invitación.'
          : 'Perderá el acceso; para volver necesitará otra invitación.',
      accion: esSalir ? 'Salir' : 'Expulsar',
    );
    if (!ok || !context.mounted) return;
    final hecho = await ejecutarConAviso(
      context,
      () => organizacionesApi.quitarMiembro(organizacion.id, miembro.usuarioId),
      error: esSalir
          ? 'No se pudo salir de la organización.'
          : 'No se pudo expulsar al miembro.',
      exito: esSalir
          ? 'Saliste de ${organizacion.nombre}'
          : '${miembro.nombre} ya no es miembro',
    );
    if (!hecho) return;
    if (esSalir) {
      onSalirOrganizacion();
    } else {
      await onRefresh();
    }
  }

  Future<void> _reenviar(BuildContext context, InvitacionDto inv) async {
    final ok = await ejecutarConAviso(
      context,
      () => organizacionesApi.reenviarInvitacion(organizacion.id, inv.id),
      error: 'No se pudo reenviar la invitación.',
      exito: 'Invitación reenviada a ${inv.email}',
    );
    if (ok) await onRefresh();
  }

  Future<void> _cancelar(BuildContext context, InvitacionDto inv) async {
    final ok = await confirmar(
      context,
      titulo: '¿Cancelar invitación?',
      mensaje: 'El enlace enviado a ${inv.email} dejará de funcionar.',
      accion: 'Cancelar',
    );
    if (!ok || !context.mounted) return;
    final hecho = await ejecutarConAviso(
      context,
      () => organizacionesApi.cancelarInvitacion(organizacion.id, inv.id),
      error: 'No se pudo cancelar la invitación.',
      exito: 'Invitación cancelada',
    );
    if (hecho) await onRefresh();
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final puedeInvitar = organizacion.puede('miembros:invitar');
    final puedeExpulsar = organizacion.puede('miembros:expulsar');
    final puedeAsignar = organizacion.puede('roles:gestionar');

    return Scaffold(
      floatingActionButton: puedeInvitar
          ? FloatingActionButton(
              tooltip: 'Invitar miembro',
              onPressed: () => _invitar(context),
              child: const Icon(Icons.person_add_outlined),
            )
          : null,
      body: RefreshIndicator(
        onRefresh: onRefresh,
        child: ListView(
          padding: const EdgeInsets.only(bottom: 88),
          children: <Widget>[
            if (organizacion.isAdmin)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                child: Text(
                  'Para salir, primero delega la administración en otro miembro.',
                  style: textTheme.bodySmall?.copyWith(
                    color: colores.tintaTenue,
                  ),
                ),
              ),
            if (miembros.isEmpty)
              const EstadoVacio(
                icono: Icons.people_outline_rounded,
                titulo: 'Sin miembros',
                mensaje: 'No hay miembros cargados en esta organización.',
              )
            else
              for (final m in miembros) ...<Widget>[
                _MiembroFila(
                  miembro: m,
                  soyYo: m.usuarioId == usuarioActualId,
                  organizacionEsAdmin: organizacion.isAdmin,
                  puedeAsignar: puedeAsignar,
                  puedeExpulsar: puedeExpulsar,
                  colores: colores,
                  onSalir: () => _quitarMiembro(context, m, esSalir: true),
                  onAsignarRoles: () => _asignarRoles(context, m),
                  onDelegarAdmin: () => _delegarAdmin(context, m),
                  onExpulsar: () => _quitarMiembro(context, m, esSalir: false),
                ),
                const Divider(indent: 72),
              ],
            if (puedeInvitar && invitaciones.isNotEmpty) ...<Widget>[
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
                child: Text(
                  'Invitaciones pendientes',
                  style: textTheme.labelLarge?.copyWith(
                    color: colores.tintaTenue,
                  ),
                ),
              ),
              for (final inv in invitaciones) ...<Widget>[
                ListTile(
                  leading: const Icon(Icons.mail_outline_rounded),
                  title: Text(
                    inv.email,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  subtitle: Text(
                    inv.isCaducada
                        ? 'Caducada'
                        : 'Caduca: ${inv.expiraEn.split('T').first}',
                    style: inv.isCaducada
                        ? TextStyle(color: colores.rosePeligro)
                        : null,
                  ),
                  trailing: PopupMenuButton<String>(
                    onSelected: (accion) {
                      if (accion == 'reenviar') _reenviar(context, inv);
                      if (accion == 'cancelar') _cancelar(context, inv);
                    },
                    itemBuilder: (_) => <PopupMenuEntry<String>>[
                      const PopupMenuItem<String>(
                        value: 'reenviar',
                        child: Text('Reenviar'),
                      ),
                      PopupMenuItem<String>(
                        value: 'cancelar',
                        child: Text(
                          'Cancelar invitación',
                          style: TextStyle(color: colores.rosePeligro),
                        ),
                      ),
                    ],
                  ),
                ),
                const Divider(indent: 56),
              ],
            ],
          ],
        ),
      ),
    );
  }
}

class _MiembroFila extends StatelessWidget {
  const _MiembroFila({
    required this.miembro,
    required this.soyYo,
    required this.organizacionEsAdmin,
    required this.puedeAsignar,
    required this.puedeExpulsar,
    required this.colores,
    required this.onSalir,
    required this.onAsignarRoles,
    required this.onDelegarAdmin,
    required this.onExpulsar,
  });

  final MiembroDto miembro;
  final bool soyYo;
  final bool organizacionEsAdmin;
  final bool puedeAsignar;
  final bool puedeExpulsar;
  final ColoresNocheIndigo colores;
  final VoidCallback onSalir;
  final VoidCallback onAsignarRoles;
  final VoidCallback onDelegarAdmin;
  final VoidCallback onExpulsar;

  @override
  Widget build(BuildContext context) {
    final inicial = miembro.nombre.trim().isNotEmpty
        ? miembro.nombre.trim()[0].toUpperCase()
        : 'U';
    final puedeSalir = soyYo && !miembro.isAdmin;
    final mostrarAsignar = puedeAsignar && !miembro.isAdmin;
    final mostrarDelegar = organizacionEsAdmin && !soyYo;
    final mostrarExpulsar = puedeExpulsar && !soyYo && !miembro.isAdmin;
    final hayAcciones =
        puedeSalir || mostrarAsignar || mostrarDelegar || mostrarExpulsar;

    final nombresRoles = miembro.roles.map((r) => r.nombre).join(', ');
    final subtitulo = <String>[
      if (miembro.isAdmin) 'Administrador',
      if (nombresRoles.isNotEmpty) nombresRoles,
      miembro.email,
    ].join(' · ');

    return ListTile(
      leading: CircleAvatar(
        backgroundColor: colores.elevada,
        foregroundColor: colores.tintaSuave,
        child: Text(inicial),
      ),
      title: Text(
        soyYo ? '${miembro.nombre} (tú)' : miembro.nombre,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      subtitle: Text(subtitulo, maxLines: 1, overflow: TextOverflow.ellipsis),
      trailing: hayAcciones
          ? PopupMenuButton<String>(
              onSelected: (accion) {
                if (accion == 'salir') onSalir();
                if (accion == 'roles') onAsignarRoles();
                if (accion == 'delegar') onDelegarAdmin();
                if (accion == 'expulsar') onExpulsar();
              },
              itemBuilder: (_) => <PopupMenuEntry<String>>[
                if (mostrarAsignar)
                  const PopupMenuItem<String>(
                    value: 'roles',
                    child: Text('Asignar roles'),
                  ),
                if (mostrarDelegar)
                  const PopupMenuItem<String>(
                    value: 'delegar',
                    child: Text('Hacer administrador'),
                  ),
                if (puedeSalir)
                  PopupMenuItem<String>(
                    value: 'salir',
                    child: Text(
                      'Salir de la organización',
                      style: TextStyle(color: colores.rosePeligro),
                    ),
                  ),
                if (mostrarExpulsar)
                  PopupMenuItem<String>(
                    value: 'expulsar',
                    child: Text(
                      'Expulsar',
                      style: TextStyle(color: colores.rosePeligro),
                    ),
                  ),
              ],
            )
          : null,
    );
  }
}
