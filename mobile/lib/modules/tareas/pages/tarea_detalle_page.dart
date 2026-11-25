import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/avisos.dart';
import '../../../core/widgets/contenido_markdown.dart';
import '../../../core/widgets/estados.dart';
import '../../organizaciones/api/organizaciones_api.dart';
import '../../plantillas/api/plantillas_api.dart';
import '../../plantillas/widgets/guardar_plantilla_sheet.dart';
import '../acciones_tarea.dart';
import '../api/comentarios_api.dart';
import '../models/tarea_model.dart';
import '../widgets/checklist_subtareas.dart';
import '../widgets/comentarios_tarea_section.dart';
import '../widgets/tarea_form.dart';
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
    this.comentariosApi,
    this.tarea,
    this.args = const TareaEditorArgs(),
    this.cargarComentarios = true,
  });

  final int id;
  final AccionesTarea acciones;
  final PlantillasApi? plantillasApi;
  final OrganizacionesApi? organizacionesApi;
  final ComentariosApi? comentariosApi;
  final TareaDto? tarea;
  final TareaEditorArgs args;
  final bool cargarComentarios;

  @override
  State<TareaDetallePage> createState() => _TareaDetallePageState();
}

class _TareaDetallePageState extends State<TareaDetallePage> {
  late TareaDto? _tarea = widget.tarea ?? widget.args.tarea;
  late final ComentariosApi _comentariosApi =
      widget.comentariosApi ??
      ComentariosApi(apiClient: widget.acciones.tareasApi.apiClient);
  late List<ResponsableCandidato> _miembros = widget.args.responsables;
  bool _guardandoSubtareas = false;
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
      if (mounted) setState(() => _tarea = tarea);
      if (tarea.organizacionId != null && _miembros.isEmpty) {
        _cargarMiembros(tarea.organizacionId!);
      }
    } catch (_) {
      if (mounted && _tarea == null) {
        setState(() => _mensajeError = 'No se pudo cargar la tarea.');
      }
    }
  }

  Future<void> _cargarMiembros(int organizacionId) async {
    final orgApi =
        widget.organizacionesApi ??
        OrganizacionesApi(apiClient: widget.acciones.tareasApi.apiClient);
    try {
      final lista = await orgApi.obtenerMiembros(organizacionId);
      if (mounted) {
        setState(() {
          _miembros = lista
              .map((m) => (id: m.usuarioId, nombre: m.nombre))
              .toList(growable: false);
        });
      }
    } catch (_) {
      // Sin acceso a miembros: los comentarios siguen funcionando sin autocompletado.
    }
  }

  Future<void> _alternarSubtarea(TareaDto tarea, int indice) async {
    if (_guardandoSubtareas) return;
    final nuevas = <SubtareaDto>[
      for (var i = 0; i < tarea.subtareas.length; i++)
        SubtareaDto(
          titulo: tarea.subtareas[i].titulo,
          completada: i == indice
              ? !tarea.subtareas[i].completada
              : tarea.subtareas[i].completada,
        ),
    ];
    final anterior = _tarea;
    setState(() {
      _guardandoSubtareas = true;
      _tarea = TareaDto(
        id: tarea.id,
        titulo: tarea.titulo,
        contenido: tarea.contenido,
        estado: tarea.estado,
        prioridad: tarea.prioridad,
        fechaInicio: tarea.fechaInicio,
        fechaVencimiento: tarea.fechaVencimiento,
        color: tarea.color,
        tagIds: tarea.tagIds,
        responsableIds: tarea.responsableIds,
        subtareas: nuevas,
        organizacionId: tarea.organizacionId,
        equipoId: tarea.equipoId,
        proyectoId: tarea.proyectoId,
      );
    });
    try {
      final ok = await ejecutarConAviso(context, () async {
        final actualizada = await widget.acciones.tareasApi.actualizar(
          tarea.id,
          <String, dynamic>{
            'subtareas': nuevas.map((s) => s.toJson()).toList(growable: false),
          },
        );
        if (mounted) setState(() => _tarea = actualizada);
      }, error: 'No se pudo actualizar la subtarea.');
      if (!ok && mounted) setState(() => _tarea = anterior);
    } finally {
      if (mounted) setState(() => _guardandoSubtareas = false);
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
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
          child: Text(
            tarea.titulo,
            style: textTheme.headlineSmall?.copyWith(
              decoration: completada ? TextDecoration.lineThrough : null,
              color: completada ? colores.tintaTenue : null,
            ),
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
          ChecklistSubtareas(
            subtareas: tarea.subtareas,
            puedeEditar: widget.acciones.sesionStore.puede('tareas:actualizar'),
            guardando: _guardandoSubtareas,
            onAlternar: (i) => _alternarSubtarea(tarea, i),
          ),
        ],
        const Divider(height: 32),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: ContenidoMarkdown(texto: tarea.contenido),
        ),
        const Divider(height: 32),
        ComentariosTareaSection(
          tarea: tarea,
          comentariosApi: _comentariosApi,
          yoId: widget.acciones.sesionStore.usuario?.id,
          miembros: _miembros,
          cargarAlIniciar: widget.cargarComentarios,
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
