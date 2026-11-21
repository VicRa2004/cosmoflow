import 'package:flutter/material.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../models/organizacion_models.dart';
import 'selector_color.dart';

/// Pestaña de ajustes de organización (`organizacion:editar` o `isAdmin`).
class AjustesOrganizacionTab extends StatelessWidget {
  const AjustesOrganizacionTab({
    super.key,
    required this.organizacion,
    required this.onEditar,
    required this.onEliminar,
  });

  final OrganizacionDto organizacion;
  final VoidCallback onEditar;
  final VoidCallback onEliminar;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final puedeEditar = organizacion.puede('organizacion:editar');
    final colorAvatar = parsearColorHex(organizacion.color);
    final inicial = organizacion.nombre.trim().isNotEmpty
        ? organizacion.nombre.trim()[0].toUpperCase()
        : 'O';

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 48),
      children: <Widget>[
        if (puedeEditar) ...<Widget>[
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text('Personalización', style: textTheme.titleMedium),
                  const SizedBox(height: 12),
                  Row(
                    children: <Widget>[
                      CircleAvatar(
                        radius: 22,
                        backgroundColor: colorAvatar ?? colores.elevada,
                        foregroundColor: colorAvatar != null
                            ? Colors.white
                            : colores.tintaSuave,
                        child: Text(inicial),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            Text(
                              organizacion.nombre,
                              style: textTheme.bodyLarge,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            if (organizacion.descripcion.trim().isNotEmpty)
                              Text(
                                organizacion.descripcion.trim(),
                                style: textTheme.bodySmall?.copyWith(
                                  color: colores.tintaTenue,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: onEditar,
                      icon: const Icon(Icons.edit_outlined),
                      label: const Text('Editar nombre, descripción y color'),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
        ],
        if (organizacion.isAdmin)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text('Eliminar organización', style: textTheme.titleMedium),
                  const SizedBox(height: 4),
                  Text(
                    'Deja de estar disponible para todos sus miembros.',
                    style: textTheme.bodySmall?.copyWith(
                      color: colores.tintaTenue,
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      style: FilledButton.styleFrom(
                        backgroundColor: colores.rosePeligro,
                        foregroundColor: Colors.white,
                      ),
                      onPressed: onEliminar,
                      icon: const Icon(Icons.delete_outline_rounded),
                      label: const Text('Eliminar organización'),
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
