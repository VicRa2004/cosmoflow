import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../models/tarea_model.dart';

/// Tablero Kanban por estado: columnas horizontales con arrastrar y soltar
/// (pulsación larga) y selector rápido para mover entre columnas.
class TableroTareas extends StatelessWidget {
  const TableroTareas({
    super.key,
    required this.tareas,
    required this.puedeActualizar,
    required this.onAbrir,
    required this.onMoverEstado,
    this.onAlternarFijada,
    this.totalElementos,
  });

  final List<TareaDto> tareas;
  final bool puedeActualizar;
  final ValueChanged<TareaDto> onAbrir;
  final void Function(TareaDto tarea, EstadoTarea nuevoEstado) onMoverEstado;
  final ValueChanged<TareaDto>? onAlternarFijada;
  final int? totalElementos;

  List<TareaDto> _tareasPorEstado(EstadoTarea estado) {
    final filtradas = tareas.where((t) => t.estado == estado).toList();
    // Fijadas siempre primero conservando el orden relativo del resto.
    final fijadas = filtradas.where((t) => t.isFijada);
    final normales = filtradas.where((t) => !t.isFijada);
    return <TareaDto>[...fijadas, ...normales];
  }

  @override
  Widget build(BuildContext context) {
    final anchoPantalla = MediaQuery.sizeOf(context).width;
    final anchoColumna = math.min(math.max(anchoPantalla - 56, 260.0), 320.0);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Expanded(
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 88),
            itemCount: EstadoTarea.values.length,
            separatorBuilder: (_, _) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final estado = EstadoTarea.values[index];
              return SizedBox(
                width: anchoColumna,
                child: _ColumnaKanban(
                  estado: estado,
                  tareas: _tareasPorEstado(estado),
                  puedeActualizar: puedeActualizar,
                  onAbrir: onAbrir,
                  onMoverEstado: onMoverEstado,
                  onAlternarFijada: onAlternarFijada,
                ),
              );
            },
          ),
        ),
        if (totalElementos != null && totalElementos! > tareas.length)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: Text(
              'Se muestran ${tareas.length} de $totalElementos tareas. Usa la búsqueda o la lista para ver el resto.',
              style: Theme.of(context).textTheme.bodySmall
                  ?.copyWith(color: context.colores.tintaTenue),
            ),
          ),
      ],
    );
  }
}

class _ColumnaKanban extends StatelessWidget {
  const _ColumnaKanban({
    required this.estado,
    required this.tareas,
    required this.puedeActualizar,
    required this.onAbrir,
    required this.onMoverEstado,
    this.onAlternarFijada,
  });

  final EstadoTarea estado;
  final List<TareaDto> tareas;
  final bool puedeActualizar;
  final ValueChanged<TareaDto> onAbrir;
  final void Function(TareaDto tarea, EstadoTarea nuevoEstado) onMoverEstado;
  final ValueChanged<TareaDto>? onAlternarFijada;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;

    return DragTarget<TareaDto>(
      onWillAcceptWithDetails: (details) =>
          puedeActualizar && details.data.estado != estado,
      onAcceptWithDetails: (details) => onMoverEstado(details.data, estado),
      builder: (context, candidatas, _) {
        final encima = candidatas.isNotEmpty;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 140),
          decoration: BoxDecoration(
            color: encima ? colores.elevada : colores.fondo,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: encima ? colores.indigoMarca : colores.borde,
              width: encima ? 1.5 : 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
                child: Row(
                  children: <Widget>[
                    Expanded(
                      child: Text(
                        estado.etiqueta,
                        style: textTheme.titleMedium,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: colores.elevada,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${tareas.length}',
                        style: textTheme.labelMedium?.copyWith(
                          color: colores.tintaTenue,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: tareas.isEmpty
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Text(
                            encima ? 'Soltar aquí' : 'Sin tareas',
                            style: textTheme.bodySmall?.copyWith(
                              color: encima
                                  ? colores.indigoMarca
                                  : colores.tintaTenue,
                            ),
                          ),
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.fromLTRB(8, 4, 8, 12),
                        itemCount: tareas.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 8),
                        itemBuilder: (context, index) {
                          final tarea = tareas[index];
                          final tarjeta = _TarjetaKanban(
                            tarea: tarea,
                            puedeActualizar: puedeActualizar,
                            onAbrir: () => onAbrir(tarea),
                            onMoverEstado: (nuevo) =>
                                onMoverEstado(tarea, nuevo),
                            onAlternarFijada: onAlternarFijada != null
                                ? () => onAlternarFijada!(tarea)
                                : null,
                          );
                          if (!puedeActualizar) return tarjeta;
                          return LongPressDraggable<TareaDto>(
                            data: tarea,
                            feedback: Material(
                              color: Colors.transparent,
                              child: SizedBox(
                                width: 260,
                                child: Opacity(opacity: 0.9, child: tarjeta),
                              ),
                            ),
                            childWhenDragging: Opacity(
                              opacity: 0.35,
                              child: tarjeta,
                            ),
                            child: tarjeta,
                          );
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _TarjetaKanban extends StatelessWidget {
  const _TarjetaKanban({
    required this.tarea,
    required this.puedeActualizar,
    required this.onAbrir,
    required this.onMoverEstado,
    this.onAlternarFijada,
  });

  final TareaDto tarea;
  final bool puedeActualizar;
  final VoidCallback onAbrir;
  final ValueChanged<EstadoTarea> onMoverEstado;
  final VoidCallback? onAlternarFijada;

  Future<void> _elegirColumna(BuildContext context) async {
    final colores = context.colores;
    final destino = await showModalBottomSheet<EstadoTarea>(
      context: context,
      showDragHandle: true,
      useSafeArea: true,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: Text(
                'Mover a columna',
                style: Theme.of(ctx).textTheme.titleMedium,
              ),
            ),
            for (final estado in EstadoTarea.values)
              ListTile(
                leading: Icon(
                  estado == tarea.estado
                      ? Icons.radio_button_checked_rounded
                      : Icons.radio_button_unchecked_rounded,
                  color: estado == tarea.estado ? colores.indigoMarca : null,
                ),
                title: Text(estado.etiqueta),
                onTap: () => Navigator.of(ctx).pop(estado),
              ),
          ],
        ),
      ),
    );
    if (destino != null && destino != tarea.estado) {
      onMoverEstado(destino);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final completada = tarea.estado == EstadoTarea.completada;

    return Material(
      color: colores.superficie,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: colores.borde),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onAbrir,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 4, 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(
                        tarea.titulo,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: textTheme.bodyLarge?.copyWith(
                          decoration: completada
                              ? TextDecoration.lineThrough
                              : null,
                          color: completada
                              ? colores.tintaTenue
                              : colores.tinta,
                        ),
                      ),
                    ),
                  ),
                  if (puedeActualizar && onAlternarFijada != null)
                    IconButton(
                      tooltip: tarea.isFijada
                          ? 'Desfijar tarea'
                          : 'Fijar tarea',
                      constraints: const BoxConstraints.tightFor(
                        width: 40,
                        height: 40,
                      ),
                      padding: EdgeInsets.zero,
                      iconSize: 18,
                      onPressed: onAlternarFijada,
                      icon: Icon(
                        tarea.isFijada
                            ? Icons.push_pin_rounded
                            : Icons.push_pin_outlined,
                        color: tarea.isFijada
                            ? colores.indigoMarca
                            : colores.tintaTenue,
                      ),
                    )
                  else if (tarea.isFijada)
                    Padding(
                      padding: const EdgeInsets.only(right: 8, top: 2),
                      child: Icon(
                        Icons.push_pin_rounded,
                        size: 16,
                        color: colores.indigoMarca,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                children: <Widget>[
                  Expanded(
                    child: Wrap(
                      spacing: 8,
                      runSpacing: 4,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: <Widget>[
                        Text(
                          tarea.prioridad.etiqueta,
                          style: textTheme.labelMedium?.copyWith(
                            color: tarea.prioridad == PrioridadTarea.alta
                                ? colores.rosePeligro
                                : colores.tintaTenue,
                          ),
                        ),
                        if (tarea.fechaVencimiento != null &&
                            tarea.fechaVencimiento!.isNotEmpty)
                          Text(
                            tarea.fechaVencimiento!,
                            style: textTheme.bodySmall?.copyWith(
                              color: colores.tintaTenue,
                            ),
                          ),
                        if (tarea.bloqueada)
                          Icon(
                            Icons.lock_outline_rounded,
                            size: 15,
                            color: colores.amberAviso,
                            semanticLabel: 'Bloqueada',
                          ),
                        if (tarea.recurrencia != null)
                          Icon(
                            Icons.repeat_rounded,
                            size: 15,
                            color: colores.indigoMarca,
                            semanticLabel:
                                'Se repite: ${tarea.recurrencia!.etiqueta}',
                          ),
                      ],
                    ),
                  ),
                  if (puedeActualizar)
                    IconButton(
                      tooltip: 'Mover de columna',
                      constraints: const BoxConstraints.tightFor(
                        width: 40,
                        height: 40,
                      ),
                      padding: EdgeInsets.zero,
                      iconSize: 18,
                      color: colores.tintaTenue,
                      onPressed: () => _elegirColumna(context),
                      icon: const Icon(Icons.swap_horiz_rounded),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
