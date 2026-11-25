import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api/adjuntos_api.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/contenido_markdown.dart';
import '../../../core/widgets/estados.dart';
import '../../organizaciones/api/organizaciones_api.dart';
import '../../plantillas/api/plantillas_api.dart';
import '../../plantillas/widgets/guardar_plantilla_sheet.dart';
import '../acciones_tarea.dart';
import '../models/tarea_model.dart';
import '../widgets/adjuntos_tarea_section.dart';
import 'tarea_editor_page.dart';

/// `/tareas/:id`: lectura a pantalla completa. Pinta al instante con la tarea
/// recibida y la refresca por id; fijar y editar en la AppBar, plantilla y eliminar en el menú.
class TareaDetallePage extends StatefulWidget {
  const TareaDetallePage({
    super.key,
    required this.id,
    required this.acciones,
    this.plantillasApi,
    this.organizacionesApi,
    this.adjuntosApi,
    this.tarea,
    this.args = const TareaEditorArgs(),
    this.selectorArchivo,
  });

  final int id;
  final AccionesTarea acciones;
  final PlantillasApi? plantillasApi;
  final OrganizacionesApi? organizacionesApi;
  final AdjuntosApi? adjuntosApi;
  final TareaDto? tarea;
  final TareaEditorArgs args;
  final SelectorArchivoAdjunto? selectorArchivo;

  @override
  State<TareaDetallePage> createState() => _TareaDetallePageState();
}

class _TareaDetallePageState extends State<TareaDetallePage> {
  late TareaDto? _tarea = widget.tarea ?? widget.args.tarea;
  late final AdjuntosApi _adjuntosApi =
      widget.adjuntosApi ??
      AdjuntosApi(apiClient: widget.acciones.tareasApi.apiClient);
  TareaDto? _tareaPrincipal;
  String? _mensajeError;

  AccionesTarea get _accionesConContexto => AccionesTarea(
    sesionStore: widget.acciones.sesionStore,
    tareasApi: widget.acciones.tareasApi,
    organizacionId: widget.args.organizacionId ?? _tarea?.organizacionId,
    equipoId: widget.args.equipoId ?? _tarea?.equipoId,
    proyectoId: widget.args.proyectoId ?? _tarea?.proyectoId,
    tags: widget.args.tags,
    responsables: widget.args.responsables,
  );

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  Future<void> _cargar() async {
    try {
      final tarea = await widget.acciones.tareasApi.obtenerUno(widget.id);
      TareaDto? principal;
      if (tarea.dependeDeId != null) {
        try {
          principal = await widget.acciones.tareasApi.obtenerUno(
            tarea.dependeDeId!,
          );
        } catch (_) {
          // Si ya no existe o no es visible, mostramos solo el id.
        }
      }
      if (mounted) {
        setState(() {
          _tarea = tarea;
          _tareaPrincipal = principal;
        });
      }
    } catch (_) {
      if (mounted && _tarea == null) {
        setState(() => _mensajeError = 'No se pudo cargar la tarea.');
      }
    }
  }

  Future<void> _tras(Future<bool> cambio) async {
    if (await cambio) await _cargar();
  }

  Future<void> _eliminar(TareaDto tarea) async {
    if (await _accionesConContexto.eliminar(context, tarea) && mounted) {
      context.pop();
    }
  }

  Future<void> _guardarComoPlantilla(TareaDto tarea) async {
    final apiClient = widget.acciones.tareasApi.apiClient;
    await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      useSafeArea: true,
      builder: (_) => GuardarPlantillaSheet(
        tarea: tarea,
        plantillasApi:
            widget.plantillasApi ?? PlantillasApi(apiClient: apiClient),
        organizacionesApi:
            widget.organizacionesApi ?? OrganizacionesApi(apiClient: apiClient),
      ),
    );
  }

  Future<void> _alSubirAdjunto(
    TareaDto tarea,
    AdjuntoDto adjunto,
    String alt,
  ) async {
    final nuevoContenido = agregarAdjuntoAMarkdown(
      tarea.contenido,
      adjunto,
      alt: alt,
    );
    final actualizada = await widget.acciones.tareasApi.actualizar(
      tarea.id,
      <String, dynamic>{'contenido': nuevoContenido},
    );
    if (mounted) setState(() => _tarea = actualizada);
  }

  Future<void> _alEliminarAdjunto(
    TareaDto tarea,
    AdjuntoReferencia adjunto,
  ) async {
    final nuevoContenido = quitarAdjuntoDeMarkdown(
      tarea.contenido,
      adjunto.url,
    );
    final actualizada = await widget.acciones.tareasApi.actualizar(
      tarea.id,
      <String, dynamic>{'contenido': nuevoContenido},
    );
    if (mounted) setState(() => _tarea = actualizada);
  }

  @override
  Widget build(BuildContext context) {
    final tarea = _tarea;
    final store = widget.acciones.sesionStore;
    final colores = context.colores;
    final puedePlantilla = store.puede('tareas:crear');
    final puedeEliminar = store.puede('tareas:eliminar');
    return Scaffold(
      appBar: AppBar(
        actions: <Widget>[
          if (tarea != null && store.puede('tareas:actualizar'))
            IconButton(
              tooltip: tarea.isFijada ? 'Desfijar' : 'Fijar',
              icon: Icon(
                tarea.isFijada
                    ? Icons.push_pin_rounded
                    : Icons.push_pin_outlined,
                color: tarea.isFijada ? colores.indigoMarca : null,
              ),
              onPressed: () =>
                  _tras(_accionesConContexto.alternarFijada(context, tarea)),
            ),
          if (tarea != null && store.puede('tareas:actualizar'))
            IconButton(
              tooltip: 'Editar',
              icon: const Icon(Icons.edit_outlined),
              onPressed: () =>
                  _tras(_accionesConContexto.editar(context, tarea)),
            ),
          if (tarea != null && (puedePlantilla || puedeEliminar))
            PopupMenuButton<String>(
              onSelected: (accion) {
                if (accion == 'plantilla') _guardarComoPlantilla(tarea);
                if (accion == 'eliminar') _eliminar(tarea);
              },
              itemBuilder: (_) => <PopupMenuEntry<String>>[
                if (puedePlantilla)
                  const PopupMenuItem<String>(
                    value: 'plantilla',
                    child: Text('Guardar como plantilla'),
                  ),
                if (puedeEliminar)
                  PopupMenuItem<String>(
                    value: 'eliminar',
                    child: Text(
                      'Eliminar',
                      style: TextStyle(color: colores.rosePeligro),
                    ),
                  ),
              ],
            ),
        ],
      ),
      body: tarea == null
          ? (_mensajeError == null
                ? const EstadoCargando()
                : EstadoError(mensaje: _mensajeError!, onReintentar: _cargar))
          : RefreshIndicator(onRefresh: _cargar, child: _contenido(tarea)),
    );
  }

  Widget _contenido(TareaDto tarea) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final store = widget.acciones.sesionStore;
    final completada = tarea.estado == EstadoTarea.completada;
    final puedeActualizar = store.puede('tareas:actualizar');
    final puedeMarcar =
        puedeActualizar && tarea.estado != EstadoTarea.cancelada;
    final nombresResponsables = tarea.responsableIds
        .map((id) {
          final m = widget.args.responsables
              .where((r) => r.id == id)
              .firstOrNull;
          return m?.nombre ?? 'Usuario #$id';
        })
        .toList(growable: false);
    final tagsTarea = widget.args.tags
        .where((t) => tarea.tagIds.contains(t.id))
        .toList(growable: false);

    return ListView(
      padding: const EdgeInsets.only(bottom: 48),
      children: <Widget>[
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: Text(
            tarea.titulo,
            style: textTheme.headlineSmall?.copyWith(
              decoration: completada ? TextDecoration.lineThrough : null,
              color: completada ? colores.tintaTenue : null,
            ),
          ),
        ),
        if (tarea.bloqueada)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: _AvisoBloqueada(tituloPrincipal: _tareaPrincipal?.titulo),
          ),
        if (puedeMarcar)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: FilledButton.tonalIcon(
              onPressed: () => _tras(
                _accionesConContexto.alternarCompletada(context, tarea),
              ),
              icon: Icon(
                completada ? Icons.replay_rounded : Icons.check_rounded,
              ),
              label: Text(completada ? 'Reabrir' : 'Marcar como completada'),
            ),
          ),
        _Dato(
          icono: Icons.flag_outlined,
          etiqueta: 'Estado',
          valor: tarea.estado.etiqueta,
        ),
        _Dato(
          icono: Icons.priority_high_rounded,
          etiqueta: 'Prioridad',
          valor: tarea.prioridad.etiqueta,
        ),
        _Dato(
          icono: Icons.event_outlined,
          etiqueta: 'Fechas',
          valor:
              '${tarea.fechaInicio ?? 'Sin inicio'} → ${tarea.fechaVencimiento ?? 'Sin vencimiento'}',
        ),
        if (tarea.recurrencia != null)
          _Dato(
            icono: Icons.repeat_rounded,
            etiqueta: 'Repetición',
            valor: tarea.recurrencia!.etiqueta,
          ),
        if (tarea.dependeDeId != null)
          _Dato(
            icono: Icons.link_rounded,
            etiqueta: 'Depende de',
            valor: _tareaPrincipal?.titulo ?? 'Tarea #${tarea.dependeDeId}',
            trailing: const Icon(Icons.chevron_right_rounded),
            onTap: () => context.push('/tareas/${tarea.dependeDeId}'),
          ),
        if (nombresResponsables.isNotEmpty)
          _Dato(
            icono: Icons.people_outline_rounded,
            etiqueta: 'Responsables',
            valor: nombresResponsables.join(', '),
          ),
        if (tarea.isCompartida)
          const _Dato(
            icono: Icons.group_outlined,
            etiqueta: 'Ámbito',
            valor: 'Compartida',
          ),
        if (tagsTarea.isNotEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: <Widget>[
                for (final tag in tagsTarea) Chip(label: Text(tag.nombre)),
              ],
            ),
          ),
        if (tarea.subtareas.isNotEmpty) ...<Widget>[
          const Divider(height: 32),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: Text(
              'Checklist',
              style: textTheme.labelLarge?.copyWith(color: colores.tintaTenue),
            ),
          ),
          for (final s in tarea.subtareas)
            ListTile(
              dense: true,
              leading: Icon(
                s.completada
                    ? Icons.check_box_rounded
                    : Icons.check_box_outline_blank_rounded,
                size: 20,
                color: s.completada ? colores.indigoMarca : colores.tintaTenue,
              ),
              title: Text(
                s.titulo,
                style: textTheme.bodyMedium?.copyWith(
                  decoration: s.completada ? TextDecoration.lineThrough : null,
                  color: s.completada ? colores.tintaTenue : null,
                ),
              ),
            ),
        ],
        const Divider(height: 32),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: ContenidoMarkdown(
            texto: tarea.contenido,
            adjuntosApi: _adjuntosApi,
          ),
        ),
        const Divider(height: 32),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: AdjuntosTareaSection(
            contenido: tarea.contenido,
            adjuntosApi: _adjuntosApi,
            organizacionId: tarea.organizacionId,
            equipoId: tarea.equipoId,
            proyectoId: tarea.proyectoId,
            puedeEditar: puedeActualizar && store.puede('adjuntos:crear'),
            onAdjuntoSubido: (adjunto, alt) =>
                _alSubirAdjunto(tarea, adjunto, alt),
            onEliminarAdjunto: (adjunto) => _alEliminarAdjunto(tarea, adjunto),
            selectorArchivo: widget.selectorArchivo,
          ),
        ),
      ],
    );
  }
}

class _AvisoBloqueada extends StatelessWidget {
  const _AvisoBloqueada({this.tituloPrincipal});

  final String? tituloPrincipal;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final texto = tituloPrincipal != null
        ? 'Bloqueada: primero hay que completar «$tituloPrincipal».'
        : 'Bloqueada: depende de una tarea sin completar.';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: colores.amberAviso.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colores.amberAviso.withValues(alpha: 0.4)),
      ),
      child: Row(
        children: <Widget>[
          Icon(Icons.lock_outline_rounded, size: 20, color: colores.amberAviso),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              texto,
              style: Theme.of(context).textTheme.bodyMedium
                  ?.copyWith(color: colores.tinta),
            ),
          ),
        ],
      ),
    );
  }
}

class _Dato extends StatelessWidget {
  const _Dato({
    required this.icono,
    required this.etiqueta,
    required this.valor,
    this.trailing,
    this.onTap,
  });

  final IconData icono;
  final String etiqueta;
  final String valor;
  final Widget? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      dense: true,
      leading: Icon(icono),
      title: Text(etiqueta, style: Theme.of(context).textTheme.bodySmall),
      subtitle: Text(valor, style: Theme.of(context).textTheme.bodyLarge),
      trailing: trailing,
      onTap: onTap,
    );
  }
}
