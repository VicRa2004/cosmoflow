import 'package:flutter/material.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../models/tarea_model.dart';

/// Hoja de lectura de tarea siguiendo la regla `DialogoLectura` de `DESIGN.md`:
/// - Las tareas se leen antes de editarse.
/// - Detalles en dos columnas, filete divisor, contenido y acciones («Editar» outline, «Eliminar» dangerGhost).
class TareaDetalleSheet extends StatelessWidget {
  const TareaDetalleSheet({
    super.key,
    required this.tarea,
    this.onEditar,
    this.onEliminar,
    this.puedeActualizar = true,
    this.puedeEliminar = true,
  });

  final TareaDto tarea;
  final VoidCallback? onEditar;
  final VoidCallback? onEliminar;
  final bool puedeActualizar;
  final bool puedeEliminar;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Text(tarea.titulo, style: textTheme.titleMedium),
            const SizedBox(height: 16),
            Wrap(
              spacing: 24,
              runSpacing: 12,
              children: <Widget>[
                _MetaItem(
                  etiqueta: 'Estado',
                  valor: tarea.estado.etiqueta,
                ),
                _MetaItem(
                  etiqueta: 'Prioridad',
                  valor: tarea.prioridad.etiqueta,
                ),
                _MetaItem(
                  etiqueta: 'Inicio',
                  valor: tarea.fechaInicio ?? 'Sin fecha',
                ),
                _MetaItem(
                  etiqueta: 'Vence',
                  valor: tarea.fechaVencimiento ?? 'Sin fecha',
                ),
              ],
            ),
            const SizedBox(height: 16),
            Divider(color: colores.borde, height: 1),
            const SizedBox(height: 16),
            Flexible(
              child: SingleChildScrollView(
                child: Text(
                  tarea.contenido.trim().isNotEmpty
                      ? tarea.contenido
                      : 'Sin contenido.',
                  style: textTheme.bodyMedium?.copyWith(
                    color: tarea.contenido.trim().isNotEmpty
                        ? colores.tinta
                        : colores.tintaTenue,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Divider(color: colores.borde, height: 1),
            const SizedBox(height: 12),
            Wrap(
              alignment: WrapAlignment.spaceBetween,
              crossAxisAlignment: WrapCrossAlignment.center,
              spacing: 8,
              runSpacing: 8,
              children: <Widget>[
                if (puedeEliminar && onEliminar != null)
                  TextButton.icon(
                    onPressed: onEliminar,
                    icon: Icon(
                      Icons.delete_outline_rounded,
                      size: 16,
                      color: colores.rosePeligro,
                    ),
                    label: Text(
                      'Eliminar',
                      style: TextStyle(color: colores.rosePeligro),
                    ),
                  )
                else
                  const SizedBox.shrink(),
                if (puedeActualizar && onEditar != null)
                  OutlinedButton.icon(
                    onPressed: onEditar,
                    icon: const Icon(Icons.edit_outlined, size: 16),
                    label: const Text('Editar'),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _MetaItem extends StatelessWidget {
  const _MetaItem({required this.etiqueta, required this.valor});

  final String etiqueta;
  final String valor;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        Text(
          etiqueta,
          style: textTheme.bodySmall?.copyWith(color: colores.tintaTenue),
        ),
        const SizedBox(height: 2),
        Text(
          valor,
          style: textTheme.bodyMedium?.copyWith(
            color: colores.tintaSuave,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
