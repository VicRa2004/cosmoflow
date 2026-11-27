import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/theme/tema_app.dart';
import '../../../core/widgets/tarjeta_seccion.dart';
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
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 92),
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
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: context.colores.tintaTenue,
              ),
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

  Color _colorEstado(ColoresNocheIndigo colores) => switch (estado) {
    EstadoTarea.pendiente => colores.tintaTenue,
    EstadoTarea.enProgreso => colores.indigoMarca,
    EstadoTarea.completada => colores.emeraldExito,
    EstadoTarea.cancelada => colores.rosePeligro,
  };

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final tono = _colorEstado(colores);

    return DragTarget<TareaDto>(
      onWillAcceptWithDetails: (details) =>
          puedeActualizar && details.data.estado != estado,
      onAcceptWithDetails: (details) => onMoverEstado(details.data, estado),
      builder: (context, candidatas, _) {
        final encima = candidatas.isNotEmpty;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 140),
          decoration: BoxDecoration(
            color: encima
                ? colores.indigoSuave.withValues(alpha: 0.65)
                : colores.elevada.withValues(alpha: 0.6),
            borderRadius: BorderRadius.circular(TemaApp.radioTarjeta),
            border: Border.all(
              color: encima ? colores.indigoMarca : colores.borde,
              width: encima ? 1.5 : 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              Padding(
                padding: const EdgeInsets.fromLTRB(14, 14, 12, 10),
                child: Row(
                  children: <Widget>[
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: tono,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        estado.etiqueta,
                        style: textTheme.titleSmall,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: colores.superficie,
                        borderRadius: BorderRadius.circular(
                          TemaApp.radioCompleto,
                        ),
                        border: Border.all(color: colores.borde),
                      ),
                      child: Text(
                        '${tareas.length}',
                        style: textTheme.labelSmall?.copyWith(
                          color: colores.tintaSuave,
                          fontWeight: FontWeight.w600,
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
                        padding: const EdgeInsets.fromLTRB(10, 2, 10, 12),
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
                                child: Opacity(opacity: 0.92, child: tarjeta),
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
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
              child: Text(
                'Mover a columna',
                style: Theme.of(ctx).textTheme.titleMedium,
              ),
            ),
            for (final estado in EstadoTarea.values)
              ListTile(
                leading: Icon(
                  estado == tarea.estado
                      ? LucideIcons.circleCheck
                      : LucideIcons.circle,
                  size: 20,
                  color: estado == tarea.estado
                      ? colores.indigoMarca
                      : colores.tintaTenue,
                ),
                title: Text(estado.etiqueta),
                onTap: () => Navigator.of(ctx).pop(estado),
              ),
            const SizedBox(height: 8),
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
        borderRadius: BorderRadius.circular(TemaApp.radioControl),
        side: BorderSide(color: colores.borde),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(TemaApp.radioControl),
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
                        style: textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w500,
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
                        width: 36,
                        height: 36,
                      ),
                      padding: EdgeInsets.zero,
                      iconSize: 16,
                      onPressed: onAlternarFijada,
                      icon: Icon(
                        LucideIcons.pin,
                        color: tarea.isFijada
                            ? colores.indigoMarca
                            : colores.tintaTenue,
                      ),
                    )
                  else if (tarea.isFijada)
                    Padding(
                      padding: const EdgeInsets.only(right: 8, top: 2),
                      child: Icon(
                        LucideIcons.pin,
                        size: 15,
                        color: colores.indigoMarca,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: <Widget>[
                  Expanded(
                    child: Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: <Widget>[
                        InsigniaPill(
                          texto: tarea.prioridad.etiqueta,
                          colorTexto: tarea.prioridad == PrioridadTarea.alta
                              ? colores.rosePeligro
                              : colores.tintaSuave,
                          colorFondo: tarea.prioridad == PrioridadTarea.alta
                              ? colores.roseSuave
                              : colores.elevada,
                        ),
                        if (tarea.fechaVencimiento != null &&
                            tarea.fechaVencimiento!.isNotEmpty)
                          InsigniaPill(
                            texto: tarea.fechaVencimiento!,
                            icono: LucideIcons.calendar,
                          ),
                        if (tarea.bloqueada)
                          Icon(
                            LucideIcons.lock,
                            size: 14,
                            color: colores.amberAviso,
                            semanticLabel: 'Bloqueada',
                          ),
                        if (tarea.recurrencia != null)
                          Icon(
                            LucideIcons.repeat,
                            size: 14,
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
                        width: 36,
                        height: 36,
                      ),
                      padding: EdgeInsets.zero,
                      iconSize: 16,
                      color: colores.tintaTenue,
                      onPressed: () => _elegirColumna(context),
                      icon: const Icon(LucideIcons.arrowLeftRight),
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
