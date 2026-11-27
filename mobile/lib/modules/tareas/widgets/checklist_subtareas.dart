import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/theme/tema_app.dart';
import '../models/tarea_model.dart';

/// Checklist interactiva de subtareas en la vista de detalle de una tarea.
class ChecklistSubtareas extends StatelessWidget {
  const ChecklistSubtareas({
    super.key,
    required this.subtareas,
    required this.puedeEditar,
    required this.guardando,
    required this.onAlternar,
  });

  final List<SubtareaDto> subtareas;
  final bool puedeEditar;
  final bool guardando;
  final ValueChanged<int> onAlternar;

  @override
  Widget build(BuildContext context) {
    if (subtareas.isEmpty) return const SizedBox.shrink();
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final total = subtareas.length;
    final completadas = subtareas.where((s) => s.completada).length;
    final fraccion = completadas / total;
    final porcentaje = (fraccion * 100).round();
    final completas = completadas == total;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
          child: Row(
            children: <Widget>[
              Icon(
                Icons.checklist_rounded,
                size: 18,
                color: colores.tintaTenue,
              ),
              const SizedBox(width: 8),
              Expanded(child: Text('Subtareas', style: textTheme.titleMedium)),
              Text(
                '$completadas/$total ($porcentaje%)',
                style: textTheme.labelMedium?.copyWith(
                  color: completas ? colores.emeraldExito : colores.tintaTenue,
                ),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(TemaApp.radioPequeno),
            child: LinearProgressIndicator(
              value: fraccion,
              minHeight: 6,
              backgroundColor: colores.elevada,
              valueColor: AlwaysStoppedAnimation<Color>(
                completas ? colores.emeraldExito : colores.indigoMarca,
              ),
            ),
          ),
        ),
        for (var i = 0; i < subtareas.length; i++)
          CheckboxListTile(
            controlAffinity: ListTileControlAffinity.leading,
            dense: true,
            value: subtareas[i].completada,
            onChanged: (!puedeEditar || guardando)
                ? null
                : (_) {
                    HapticFeedback.selectionClick();
                    onAlternar(i);
                  },
            title: Text(
              subtareas[i].titulo,
              style: textTheme.bodyLarge?.copyWith(
                decoration: subtareas[i].completada
                    ? TextDecoration.lineThrough
                    : null,
                color: subtareas[i].completada ? colores.tintaTenue : null,
              ),
            ),
          ),
      ],
    );
  }
}
