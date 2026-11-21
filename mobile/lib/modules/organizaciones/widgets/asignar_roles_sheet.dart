import 'package:flutter/material.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../models/organizacion_models.dart';

/// Bottom sheet para asignar los roles de un miembro (RN-14: varios o ninguno).
class AsignarRolesSheet extends StatefulWidget {
  const AsignarRolesSheet({
    super.key,
    required this.miembro,
    required this.roles,
  });

  final MiembroDto miembro;
  final List<RolOrganizacionDto> roles;

  @override
  State<AsignarRolesSheet> createState() => _AsignarRolesSheetState();
}

class _AsignarRolesSheetState extends State<AsignarRolesSheet> {
  late final Set<int> _seleccionados = widget.miembro.roles
      .map((r) => r.id)
      .toSet();

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final colores = context.colores;

    return Padding(
      padding: EdgeInsets.fromLTRB(
        16,
        0,
        16,
        16 + MediaQuery.viewInsetsOf(context).bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Text(
            'Roles de ${widget.miembro.nombre}',
            style: textTheme.titleMedium,
          ),
          const SizedBox(height: 12),
          if (widget.roles.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Text(
                'Aún no hay roles en la organización. Crea uno en la pestaña Roles.',
                style: textTheme.bodyMedium?.copyWith(
                  color: colores.tintaSuave,
                ),
              ),
            )
          else
            Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: widget.roles.length,
                itemBuilder: (context, index) {
                  final rol = widget.roles[index];
                  return CheckboxListTile(
                    contentPadding: EdgeInsets.zero,
                    value: _seleccionados.contains(rol.id),
                    title: Text(rol.nombre),
                    subtitle: Text(
                      '${rol.permisos.length} ${rol.permisos.length == 1 ? 'permiso' : 'permisos'}',
                    ),
                    onChanged: (v) {
                      setState(() {
                        if (v ?? false) {
                          _seleccionados.add(rol.id);
                        } else {
                          _seleccionados.remove(rol.id);
                        }
                      });
                    },
                  );
                },
              ),
            ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: widget.roles.isEmpty
                ? null
                : () =>
                      Navigator.of(context)
                          .pop(_seleccionados.toList(growable: false)),
            child: const Text('Guardar'),
          ),
        ],
      ),
    );
  }
}
