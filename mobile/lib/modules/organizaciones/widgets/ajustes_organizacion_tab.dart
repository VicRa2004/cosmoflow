import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/tarjeta_seccion.dart';
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
      padding: const EdgeInsets.only(top: 16, bottom: 48),
      children: <Widget>[
        if (puedeEditar) ...<Widget>[
          TarjetaSeccion(
            titulo: 'Personalización',
            mostrarDivisores: false,
            paddingInterno: const EdgeInsets.all(16),
            children: <Widget>[
              Row(
                children: <Widget>[
                  Container(
                    width: 46,
                    height: 46,
                    decoration: BoxDecoration(
                      color: colorAvatar ?? colores.indigoSuave,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      inicial,
                      style: textTheme.titleLarge?.copyWith(
                        color: colorAvatar != null
                            ? Colors.white
                            : colores.indigoMarca,
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text(
                          organizacion.nombre,
                          style: textTheme.titleMedium,
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
                  icon: const Icon(LucideIcons.pencil, size: 16),
                  label: const Text('Editar nombre, descripción y color'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
        ],
        if (organizacion.isAdmin)
          TarjetaSeccion(
            titulo: 'Zona de peligro',
            colorTitulo: colores.rosePeligro,
            mostrarDivisores: false,
            paddingInterno: const EdgeInsets.all(16),
            children: <Widget>[
              Text('Eliminar organización', style: textTheme.titleMedium),
              const SizedBox(height: 4),
              Text(
                'Deja de estar disponible para todos sus miembros.',
                style: textTheme.bodySmall?.copyWith(color: colores.tintaTenue),
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
                  icon: const Icon(LucideIcons.trash2, size: 16),
                  label: const Text('Eliminar organización'),
                ),
              ),
            ],
          ),
      ],
    );
  }
}
