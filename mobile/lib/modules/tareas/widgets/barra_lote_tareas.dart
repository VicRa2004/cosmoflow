import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../models/tarea_model.dart';

/// Barra inferior de acciones en lote cuando hay tareas seleccionadas.
class BarraLoteTareas extends StatelessWidget {
  const BarraLoteTareas({
    super.key,
    required this.cantidad,
    required this.ocupado,
    required this.puedeActualizar,
    required this.puedeEliminar,
    required this.onCambiarEstado,
    required this.onCambiarPrioridad,
    required this.onEliminar,
    required this.onCancelar,
  });

  final int cantidad;
  final bool ocupado;
  final bool puedeActualizar;
  final bool puedeEliminar;
  final ValueChanged<EstadoTarea> onCambiarEstado;
  final ValueChanged<PrioridadTarea> onCambiarPrioridad;
  final VoidCallback onEliminar;
  final VoidCallback onCancelar;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;

    return Material(
      color: colores.superficie,
      child: SafeArea(
        top: false,
        child: Container(
          decoration: BoxDecoration(
            border: Border(top: BorderSide(color: colores.borde, width: 1)),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Row(
            children: <Widget>[
              IconButton(
                tooltip: 'Cancelar selección',
                onPressed: ocupado ? null : onCancelar,
                icon: const Icon(LucideIcons.x),
              ),
              Expanded(
                child: Text(
                  '$cantidad ${cantidad == 1 ? 'seleccionada' : 'seleccionadas'}',
                  style: textTheme.titleSmall,
                ),
              ),
              if (puedeActualizar)
                PopupMenuButton<EstadoTarea>(
                  enabled: !ocupado,
                  tooltip: 'Cambiar estado',
                  icon: const Icon(LucideIcons.circleCheck),
                  onSelected: onCambiarEstado,
                  itemBuilder: (_) => <PopupMenuEntry<EstadoTarea>>[
                    for (final e in EstadoTarea.values)
                      PopupMenuItem<EstadoTarea>(
                        value: e,
                        child: Text(e.etiqueta),
                      ),
                  ],
                ),
              if (puedeActualizar)
                PopupMenuButton<PrioridadTarea>(
                  enabled: !ocupado,
                  tooltip: 'Cambiar prioridad',
                  icon: const Icon(LucideIcons.flag),
                  onSelected: onCambiarPrioridad,
                  itemBuilder: (_) => <PopupMenuEntry<PrioridadTarea>>[
                    for (final p in PrioridadTarea.values)
                      PopupMenuItem<PrioridadTarea>(
                        value: p,
                        child: Text('Prioridad ${p.etiqueta.toLowerCase()}'),
                      ),
                  ],
                ),
              if (puedeEliminar)
                IconButton(
                  tooltip: 'Eliminar seleccionadas',
                  onPressed: ocupado ? null : onEliminar,
                  icon: Icon(LucideIcons.trash2, color: colores.rosePeligro),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
