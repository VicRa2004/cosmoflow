import 'package:flutter/material.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/avisos.dart';
import '../../../core/widgets/confirmar.dart';
import '../../../core/widgets/estados.dart';
import '../api/organizaciones_api.dart';
import '../models/organizacion_models.dart';

/// Pestaña de roles personalizados de una organización (`roles:gestionar`).
class ListaRolesOrganizacion extends StatelessWidget {
  const ListaRolesOrganizacion({
    super.key,
    required this.organizacionId,
    required this.roles,
    required this.organizacionesApi,
    required this.onRefresh,
    required this.onCrearRol,
    required this.onEditarRol,
  });

  final int organizacionId;
  final List<RolOrganizacionDto> roles;
  final OrganizacionesApi organizacionesApi;
  final Future<void> Function() onRefresh;
  final VoidCallback onCrearRol;
  final ValueChanged<RolOrganizacionDto> onEditarRol;

  Future<void> _eliminarRol(
    BuildContext context,
    RolOrganizacionDto rol,
  ) async {
    final ok = await confirmar(
      context,
      titulo: '¿Eliminar el rol «${rol.nombre}»?',
      mensaje: 'Quienes lo tengan perderán sus permisos en el acto.',
      accion: 'Eliminar',
    );
    if (!ok || !context.mounted) return;
    final hecho = await ejecutarConAviso(
      context,
      () => organizacionesApi.eliminarRol(organizacionId, rol.id),
      error: 'No se pudo eliminar el rol.',
      exito: 'Rol eliminado',
    );
    if (hecho) await onRefresh();
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      floatingActionButton: FloatingActionButton(
        tooltip: 'Nuevo rol',
        onPressed: onCrearRol,
        child: const Icon(Icons.add_rounded),
      ),
      body: RefreshIndicator(
        onRefresh: onRefresh,
        child: ListView(
          padding: const EdgeInsets.only(bottom: 88),
          children: <Widget>[
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Text(
                'Opcionales. Dan permisos a los miembros; el administrador ya los tiene todos.',
                style: textTheme.bodySmall?.copyWith(color: colores.tintaTenue),
              ),
            ),
            if (roles.isEmpty)
              const EstadoVacio(
                icono: Icons.shield_outlined,
                titulo: 'Sin roles',
                mensaje: 'Crea un rol para delegar permisos concretos.',
              )
            else
              for (final rol in roles) ...<Widget>[
                ListTile(
                  onTap: () => onEditarRol(rol),
                  leading: const Icon(Icons.shield_outlined),
                  title: Text(
                    rol.nombre,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  subtitle: Text(
                    '${rol.permisos.length} ${rol.permisos.length == 1 ? 'permiso' : 'permisos'} · '
                    '${rol.totalMiembros} ${rol.totalMiembros == 1 ? 'miembro' : 'miembros'}',
                  ),
                  trailing: PopupMenuButton<String>(
                    onSelected: (accion) {
                      if (accion == 'editar') onEditarRol(rol);
                      if (accion == 'eliminar') _eliminarRol(context, rol);
                    },
                    itemBuilder: (_) => <PopupMenuEntry<String>>[
                      const PopupMenuItem<String>(
                        value: 'editar',
                        child: Text('Editar'),
                      ),
                      PopupMenuItem<String>(
                        value: 'eliminar',
                        child: Text(
                          'Eliminar',
                          style: TextStyle(color: colores.rosePeligro),
                        ),
                      ),
                    ],
                  ),
                ),
                const Divider(indent: 56),
              ],
          ],
        ),
      ),
    );
  }
}
