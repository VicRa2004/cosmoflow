import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/api/adjuntos_api.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../models/tarea_model.dart';
import 'adjuntos_tarea_section.dart';

/// Sección del formulario de tarea para recurrencia, dependencia, fijado y adjuntos.
class TareaFormOpciones extends StatelessWidget {
  const TareaFormOpciones({
    super.key,
    required this.recurrencia,
    required this.onRecurrenciaChanged,
    required this.dependeDeId,
    required this.tareasCandidatas,
    required this.onDependeDeChanged,
    required this.isFijada,
    required this.onFijadaChanged,
    this.contenidoParaAdjuntos = '',
    this.adjuntosApi,
    this.organizacionId,
    this.equipoId,
    this.proyectoId,
    this.onAdjuntoSubido,
    this.onEliminarAdjunto,
    this.selectorArchivo,
  });

  final RecurrenciaTarea? recurrencia;
  final ValueChanged<RecurrenciaTarea?> onRecurrenciaChanged;
  final int? dependeDeId;
  final List<TareaDto> tareasCandidatas;
  final ValueChanged<int?> onDependeDeChanged;
  final bool isFijada;
  final ValueChanged<bool> onFijadaChanged;
  final String contenidoParaAdjuntos;
  final AdjuntosApi? adjuntosApi;
  final int? organizacionId;
  final int? equipoId;
  final int? proyectoId;
  final Future<void> Function(AdjuntoDto adjunto, String alt)? onAdjuntoSubido;
  final Future<void> Function(AdjuntoReferencia adjunto)? onEliminarAdjunto;
  final SelectorArchivoAdjunto? selectorArchivo;

  String _etiquetaDependencia() {
    if (dependeDeId == null) return 'Ninguna';
    for (final t in tareasCandidatas) {
      if (t.id == dependeDeId) return t.titulo;
    }
    return 'Tarea #$dependeDeId';
  }

  Future<void> _elegirDependencia(BuildContext context) async {
    final colores = context.colores;
    final seleccion = await showModalBottomSheet<int?>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      useSafeArea: true,
      builder: (ctx) => _SelectorDependenciaSheet(
        seleccionActual: dependeDeId,
        candidatas: tareasCandidatas,
        colorSeleccion: colores.indigoMarca,
      ),
    );
    // `-1` distingue «Ninguna» de cerrar el bottom sheet sin elegir (`null`).
    if (seleccion == null) return;
    onDependeDeChanged(seleccion == -1 ? null : seleccion);
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final seccion = Theme.of(context).textTheme.labelLarge
        ?.copyWith(color: colores.tintaTenue);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        const SizedBox(height: 24),
        Text('Opciones', style: seccion),
        const SizedBox(height: 8),
        DropdownButtonFormField<RecurrenciaTarea?>(
          initialValue: recurrencia,
          decoration: const InputDecoration(
            labelText: 'Repetición',
            prefixIcon: Icon(LucideIcons.repeat, size: 18),
          ),
          items: <DropdownMenuItem<RecurrenciaTarea?>>[
            const DropdownMenuItem<RecurrenciaTarea?>(
              value: null,
              child: Text('No se repite'),
            ),
            for (final r in RecurrenciaTarea.values)
              DropdownMenuItem<RecurrenciaTarea?>(
                value: r,
                child: Text(r.etiqueta),
              ),
          ],
          onChanged: onRecurrenciaChanged,
        ),
        const SizedBox(height: 16),
        InkWell(
          borderRadius: BorderRadius.circular(8),
          onTap: () => _elegirDependencia(context),
          child: InputDecorator(
            decoration: InputDecoration(
              labelText: 'Depende de',
              prefixIcon: const Icon(LucideIcons.link, size: 18),
              suffixIcon: dependeDeId != null
                  ? IconButton(
                      tooltip: 'Quitar dependencia',
                      onPressed: () => onDependeDeChanged(null),
                      icon: const Icon(LucideIcons.x, size: 18),
                    )
                  : const Icon(LucideIcons.chevronRight, size: 18),
            ),
            child: Text(
              _etiquetaDependencia(),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ),
        const SizedBox(height: 8),
        SwitchListTile(
          contentPadding: EdgeInsets.zero,
          secondary: Icon(
            LucideIcons.pin,
            size: 18,
            color: isFijada ? colores.indigoMarca : colores.tintaTenue,
          ),
          title: const Text('Fijar tarea'),
          subtitle: const Text('Aparece primero en los listados y el tablero'),
          value: isFijada,
          onChanged: onFijadaChanged,
        ),
        if (adjuntosApi != null) ...<Widget>[
          const SizedBox(height: 16),
          AdjuntosTareaSection(
            contenido: contenidoParaAdjuntos,
            adjuntosApi: adjuntosApi!,
            organizacionId: organizacionId,
            equipoId: equipoId,
            proyectoId: proyectoId,
            puedeEditar: true,
            onAdjuntoSubido: onAdjuntoSubido,
            onEliminarAdjunto: onEliminarAdjunto,
            selectorArchivo: selectorArchivo,
          ),
        ],
      ],
    );
  }
}

class _SelectorDependenciaSheet extends StatelessWidget {
  const _SelectorDependenciaSheet({
    required this.seleccionActual,
    required this.candidatas,
    required this.colorSeleccion,
  });

  final int? seleccionActual;
  final List<TareaDto> candidatas;
  final Color colorSeleccion;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return SafeArea(
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.sizeOf(context).height * 0.65,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: Text('Depende de', style: textTheme.titleMedium),
            ),
            Flexible(
              child: ListView(
                shrinkWrap: true,
                children: <Widget>[
                  ListTile(
                    leading: Icon(
                      seleccionActual == null
                          ? LucideIcons.circleCheck
                          : LucideIcons.circle,
                      size: 18,
                      color: seleccionActual == null ? colorSeleccion : null,
                    ),
                    title: const Text('Ninguna'),
                    onTap: () => Navigator.of(context).pop(-1),
                  ),
                  const Divider(height: 1),
                  if (candidatas.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(16),
                      child: Text(
                        'No hay otras tareas en este sitio para enlazar.',
                      ),
                    )
                  else
                    for (final tarea in candidatas)
                      ListTile(
                        leading: Icon(
                          seleccionActual == tarea.id
                              ? LucideIcons.circleCheck
                              : LucideIcons.circle,
                          size: 18,
                          color: seleccionActual == tarea.id
                              ? colorSeleccion
                              : null,
                        ),
                        title: Text(
                          tarea.titulo,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        subtitle: Text(tarea.estado.etiqueta),
                        onTap: () => Navigator.of(context).pop(tarea.id),
                      ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
