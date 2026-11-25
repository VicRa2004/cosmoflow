import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/contenido_markdown.dart';
import '../../../core/widgets/estados.dart';
import '../../organizaciones/api/organizaciones_api.dart';
import '../../plantillas/api/plantillas_api.dart';
import '../../plantillas/widgets/guardar_plantilla_sheet.dart';
import '../acciones_tarea.dart';
import '../models/tarea_model.dart';
import 'tarea_editor_page.dart';

/// `/tareas/:id`: lectura a pantalla completa. Pinta al instante con la tarea
/// recibida y la refresca por id; editar en la AppBar, plantilla y eliminar en el menú.
class TareaDetallePage extends StatefulWidget {
  const TareaDetallePage({
    super.key,
    required this.id,
    required this.acciones,
    this.plantillasApi,
    this.organizacionesApi,
    this.tarea,
    this.args = const TareaEditorArgs(),
  });

  final int id;
  final AccionesTarea acciones;
  final PlantillasApi? plantillasApi;
  final OrganizacionesApi? organizacionesApi;
  final TareaDto? tarea;
  final TareaEditorArgs args;

  @override
  State<TareaDetallePage> createState() => _TareaDetallePageState();
}

class _TareaDetallePageState extends State<TareaDetallePage> {
  late TareaDto? _tarea = widget.tarea ?? widget.args.tarea;
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
    widget.acciones.tareasApi.cola?.addListener(_alCambiarCola);
    _cargar();
  }

  @override
  void dispose() {
    widget.acciones.tareasApi.cola?.removeListener(_alCambiarCola);
    super.dispose();
  }

  void _alCambiarCola() {
    if (mounted) setState(() {});
  }

  Future<void> _cargar() async {
    try {
      final tarea = await widget.acciones.tareasApi.obtenerUno(widget.id);
      if (mounted) setState(() => _tarea = tarea);
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

  @override
  Widget build(BuildContext context) {
    final store = widget.acciones.sesionStore;
    final usuarioId = store.usuario?.id;
    final tareaBase = _tarea;
    final tarea = tareaBase == null
        ? null
        : widget.acciones.tareasApi.aplicarPendiente(usuarioId, tareaBase);
    final pendiente =
        tarea != null &&
        usuarioId != null &&
        (widget.acciones.tareasApi.cola?.tieneCambiosPendientes(
              usuarioId,
              '/tareas',
              tarea.id,
            ) ??
            false);
    final colores = context.colores;
    final puedePlantilla = store.puede('tareas:crear');
    final puedeEliminar = store.puede('tareas:eliminar');
    return Scaffold(
      appBar: AppBar(
        actions: <Widget>[
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
          : RefreshIndicator(
              onRefresh: _cargar,
              child: _contenido(tarea, pendiente),
            ),
    );
  }

  Widget _contenido(TareaDto tarea, bool pendiente) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final completada = tarea.estado == EstadoTarea.completada;
    final puedeMarcar =
        widget.acciones.sesionStore.puede('tareas:actualizar') &&
        tarea.estado != EstadoTarea.cancelada;
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
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                tarea.titulo,
                style: textTheme.headlineSmall?.copyWith(
                  decoration: completada ? TextDecoration.lineThrough : null,
                  color: completada ? colores.tintaTenue : null,
                ),
              ),
              if (pendiente) ...<Widget>[
                const SizedBox(height: 8),
                Row(
                  children: <Widget>[
                    Icon(
                      Icons.cloud_upload_outlined,
                      size: 16,
                      color: colores.amberAviso,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'Cambios pendientes de subir',
                      style: textTheme.labelMedium?.copyWith(
                        color: colores.amberAviso,
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
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
          child: ContenidoMarkdown(texto: tarea.contenido),
        ),
      ],
    );
  }
}

class _Dato extends StatelessWidget {
  const _Dato({
    required this.icono,
    required this.etiqueta,
    required this.valor,
  });

  final IconData icono;
  final String etiqueta;
  final String valor;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      dense: true,
      leading: Icon(icono),
      title: Text(etiqueta, style: Theme.of(context).textTheme.bodySmall),
      subtitle: Text(valor, style: Theme.of(context).textTheme.bodyLarge),
    );
  }
}
