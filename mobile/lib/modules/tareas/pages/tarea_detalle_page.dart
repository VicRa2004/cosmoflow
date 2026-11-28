import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/api/adjuntos_api.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/avisos.dart';
import '../../../core/widgets/contenido_markdown.dart';
import '../../../core/widgets/estados.dart';
import '../../../core/widgets/tarjeta_seccion.dart';
import '../../organizaciones/api/organizaciones_api.dart';
import '../../organizaciones/models/organizacion_models.dart';
import '../../organizaciones/services/contexto_organizacion_cache.dart';
import '../../plantillas/api/plantillas_api.dart';
import '../../plantillas/widgets/guardar_plantilla_sheet.dart';
import '../../tags/api/tags_api.dart';
import '../../tags/models/tag_model.dart';
import '../acciones_tarea.dart';
import '../api/comentarios_api.dart';
import '../models/tarea_model.dart';
import '../widgets/actividad_tarea_section.dart';
import '../widgets/adjuntos_tarea_section.dart';
import '../widgets/checklist_subtareas.dart';
import '../widgets/comentarios_tarea_section.dart';
import '../widgets/tarea_detalle_resumen.dart';
import '../widgets/tarea_form.dart';
import 'tarea_editor_page.dart';

/// `/tareas/:id`: detalle limpio con título + check animado, pills interactivas,
/// tarjeta compacta de fechas/propiedades y foco en subtareas y descripción.
class TareaDetallePage extends StatefulWidget {
  const TareaDetallePage({
    super.key,
    required this.id,
    required this.acciones,
    this.plantillasApi,
    this.organizacionesApi,
    this.tagsApi,
    this.adjuntosApi,
    this.comentariosApi,
    this.tarea,
    this.args = const TareaEditorArgs(),
    this.selectorArchivo,
    this.cargarComentarios = true,
  });

  final int id;
  final AccionesTarea acciones;
  final PlantillasApi? plantillasApi;
  final OrganizacionesApi? organizacionesApi;
  final TagsApi? tagsApi;
  final AdjuntosApi? adjuntosApi;
  final ComentariosApi? comentariosApi;
  final TareaDto? tarea;
  final TareaEditorArgs args;
  final SelectorArchivoAdjunto? selectorArchivo;
  final bool cargarComentarios;

  @override
  State<TareaDetallePage> createState() => _TareaDetallePageState();
}

class _TareaDetallePageState extends State<TareaDetallePage> {
  late TareaDto? _tarea = widget.tarea ?? widget.args.tarea;
  late final AdjuntosApi _adjuntosApi =
      widget.adjuntosApi ??
      AdjuntosApi(apiClient: widget.acciones.tareasApi.apiClient);
  late final ComentariosApi _comentariosApi =
      widget.comentariosApi ??
      ComentariosApi(apiClient: widget.acciones.tareasApi.apiClient);
  late final ContextoOrganizacionCache _contextoCache =
      ContextoOrganizacionCache(
        organizacionesApi:
            widget.organizacionesApi ??
            OrganizacionesApi(apiClient: widget.acciones.tareasApi.apiClient),
      );
  late List<ResponsableCandidato> _miembros = widget.args.responsables;
  List<MiembroDto> _miembrosDto = const <MiembroDto>[];
  late List<TagDto> _tags = widget.args.tags;
  late UbicacionTarea? _ubicacion = widget.args.ubicacion;
  TareaDto? _tareaPrincipal;
  bool _guardandoSubtareas = false;
  String? _mensajeError;

  AccionesTarea get _accionesConContexto => AccionesTarea(
    sesionStore: widget.acciones.sesionStore,
    tareasApi: widget.acciones.tareasApi,
    organizacionId: widget.args.organizacionId ?? _tarea?.organizacionId,
    equipoId: widget.args.equipoId ?? _tarea?.equipoId,
    proyectoId: widget.args.proyectoId ?? _tarea?.proyectoId,
    tags: _tags,
    responsables: _miembros,
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
        } catch (_) {}
      }
      if (mounted) {
        setState(() {
          _tarea = tarea;
          _tareaPrincipal = principal;
        });
      }
      if (tarea.organizacionId != null) {
        _cargarContextoOrganizacion(tarea);
      }
      if (tarea.tagIds.isNotEmpty && _tags.isEmpty) {
        _cargarTags(tarea.organizacionId);
      }
    } catch (_) {
      if (mounted && _tarea == null) {
        setState(() => _mensajeError = 'No se pudo cargar la tarea.');
      }
    }
  }

  Future<void> _cargarContextoOrganizacion(TareaDto tarea) async {
    final orgId = tarea.organizacionId;
    if (orgId == null) return;
    try {
      final ubicacion = await _contextoCache.resolverUbicacion(
        organizacionId: orgId,
        equipoId: tarea.equipoId,
        proyectoId: tarea.proyectoId,
      );
      final lista = await _contextoCache.obtenerMiembros(orgId);
      if (mounted) {
        setState(() {
          if (ubicacion != null) _ubicacion = ubicacion;
          if (lista.isNotEmpty) {
            _miembrosDto = lista;
            if (_miembros.isEmpty) {
              _miembros = lista
                  .map((m) => (id: m.usuarioId, nombre: m.nombre))
                  .toList(growable: false);
            }
          }
        });
      }
    } catch (_) {}
  }

  Future<void> _cargarTags(int? organizacionId) async {
    final tagsApi =
        widget.tagsApi ??
        TagsApi(apiClient: widget.acciones.tareasApi.apiClient);
    try {
      final pagina = await tagsApi.obtenerTodos(organizacionId: organizacionId);
      if (mounted) setState(() => _tags = pagina.datos);
    } catch (_) {}
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
        isFijada: tarea.isFijada,
        tagIds: tarea.tagIds,
        responsableIds: tarea.responsableIds,
        subtareas: nuevas,
        organizacionId: tarea.organizacionId,
        equipoId: tarea.equipoId,
        proyectoId: tarea.proyectoId,
        dependeDeId: tarea.dependeDeId,
        bloqueada: tarea.bloqueada,
        recurrencia: tarea.recurrencia,
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

  Future<void> _duplicar(TareaDto tarea) async {
    TareaDto? copia;
    final ok = await ejecutarConAviso(
      context,
      () async => copia = await widget.acciones.tareasApi.duplicar(tarea.id),
      error: 'No se pudo duplicar la tarea.',
      exito: 'Tarea duplicada.',
    );
    if (ok && copia != null && mounted) {
      await _accionesConContexto.abrirDetalle(
        context,
        copia!,
        ubicacion: _ubicacion,
      );
    }
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
                LucideIcons.pin,
                color: tarea.isFijada ? colores.indigoMarca : null,
              ),
              onPressed: () =>
                  _tras(_accionesConContexto.alternarFijada(context, tarea)),
            ),
          if (tarea != null && store.puede('tareas:actualizar'))
            IconButton(
              tooltip: 'Editar',
              icon: const Icon(LucideIcons.pencil),
              onPressed: () =>
                  _tras(_accionesConContexto.editar(context, tarea)),
            ),
          if (tarea != null && (puedePlantilla || puedeEliminar))
            PopupMenuButton<String>(
              icon: const Icon(LucideIcons.ellipsisVertical),
              onSelected: (accion) {
                if (accion == 'duplicar') _duplicar(tarea);
                if (accion == 'plantilla') _guardarComoPlantilla(tarea);
                if (accion == 'eliminar') _eliminar(tarea);
              },
              itemBuilder: (_) => <PopupMenuEntry<String>>[
                if (puedePlantilla)
                  const PopupMenuItem<String>(
                    value: 'duplicar',
                    child: Text('Duplicar'),
                  ),
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
    final responsables = tarea.responsableIds
        .map((id) {
          final dto = _miembrosDto.where((m) => m.usuarioId == id).firstOrNull;
          if (dto != null) {
            return (nombre: dto.nombre, avatarUrl: dto.avatarUrl);
          }
          final m = _miembros.where((r) => r.id == id).firstOrNull;
          return (nombre: m?.nombre ?? 'Usuario #$id', avatarUrl: null);
        })
        .toList(growable: false);
    final tagsTarea = _tags
        .where((t) => tarea.tagIds.contains(t.id))
        .toList(growable: false);

    return ListView(
      padding: const EdgeInsets.only(top: 4, bottom: 48),
      children: <Widget>[
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
          child: InsigniasUbicacionTarea(tarea: tarea, ubicacion: _ubicacion),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
          child: Text(
            tarea.titulo,
            style: textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w700,
              decoration: completada ? TextDecoration.lineThrough : null,
              color: completada ? colores.tintaTenue : null,
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
          child: ChipsEstadoPrioridadTarea(
            tarea: tarea,
            tags: tagsTarea,
            onCambiarEstado: puedeActualizar
                ? (estado) => _tras(
                    _accionesConContexto.cambiarEstado(context, tarea, estado),
                  )
                : null,
          ),
        ),
        if (puedeMarcar)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
            child: FilledButton.icon(
              style: completada
                  ? FilledButton.styleFrom(
                      backgroundColor: colores.superficie,
                      foregroundColor: colores.tinta,
                      side: BorderSide(color: colores.borde),
                    )
                  : null,
              onPressed: () => _tras(
                _accionesConContexto.alternarCompletada(context, tarea),
              ),
              icon: Icon(
                completada ? LucideIcons.rotateCcw : LucideIcons.check,
                size: 18,
              ),
              label: Text(completada ? 'Reabrir' : 'Marcar como completada'),
            ),
          ),
        if (tarea.bloqueada)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
            child: AvisoTareaBloqueada(
              tituloPrincipal: _tareaPrincipal?.titulo,
            ),
          ),
        ResumenPropiedadesTarea(
          tarea: tarea,
          responsables: responsables,
          ubicacion: _ubicacion,
          tareaPrincipal: _tareaPrincipal,
          onAbrirPrincipal: tarea.dependeDeId != null
              ? () => context.push('/tareas/${tarea.dependeDeId}')
              : null,
        ),
        if (tarea.subtareas.isNotEmpty) ...<Widget>[
          const SizedBox(height: 14),
          TarjetaSeccion(
            mostrarDivisores: false,
            paddingInterno: const EdgeInsets.symmetric(vertical: 8),
            children: <Widget>[
              ChecklistSubtareas(
                subtareas: tarea.subtareas,
                puedeEditar: puedeActualizar,
                guardando: _guardandoSubtareas,
                onAlternar: (i) => _alternarSubtarea(tarea, i),
              ),
            ],
          ),
        ],
        const SizedBox(height: 14),
        TarjetaSeccion(
          titulo: 'Descripción',
          mostrarDivisores: false,
          paddingInterno: const EdgeInsets.all(16),
          children: <Widget>[
            ContenidoMarkdown(
              texto: tarea.contenido,
              adjuntosApi: _adjuntosApi,
            ),
          ],
        ),
        const SizedBox(height: 14),
        TarjetaSeccion(
          mostrarDivisores: false,
          paddingInterno: const EdgeInsets.all(16),
          children: <Widget>[
            AdjuntosTareaSection(
              contenido: tarea.contenido,
              adjuntosApi: _adjuntosApi,
              organizacionId: tarea.organizacionId,
              equipoId: tarea.equipoId,
              proyectoId: tarea.proyectoId,
              puedeEditar: puedeActualizar && store.puede('adjuntos:crear'),
              onAdjuntoSubido: (adjunto, alt) =>
                  _alSubirAdjunto(tarea, adjunto, alt),
              onEliminarAdjunto: (adjunto) =>
                  _alEliminarAdjunto(tarea, adjunto),
              selectorArchivo: widget.selectorArchivo,
            ),
          ],
        ),
        const SizedBox(height: 14),
        TarjetaSeccion(
          mostrarDivisores: false,
          paddingInterno: const EdgeInsets.symmetric(vertical: 8),
          children: <Widget>[
            ComentariosTareaSection(
              tarea: tarea,
              comentariosApi: _comentariosApi,
              yoId: widget.acciones.sesionStore.usuario?.id,
              miembros: _miembros,
              cargarAlIniciar: widget.cargarComentarios,
            ),
          ],
        ),
        const SizedBox(height: 14),
        TarjetaSeccion(
          mostrarDivisores: false,
          children: <Widget>[
            ActividadTareaSection(
              tareaId: tarea.id,
              tareasApi: widget.acciones.tareasApi,
            ),
          ],
        ),
      ],
    );
  }
}
