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
import '../../plantillas/api/plantillas_api.dart';
import '../../plantillas/widgets/guardar_plantilla_sheet.dart';
import '../acciones_tarea.dart';
import '../api/comentarios_api.dart';
import '../models/tarea_model.dart';
import '../widgets/adjuntos_tarea_section.dart';
import '../widgets/checklist_subtareas.dart';
import '../widgets/comentarios_tarea_section.dart';
import '../widgets/tarea_form.dart';
import 'tarea_editor_page.dart';

/// `/tareas/:id`: lectura a pantalla completa agrupada en tarjetas limpias.
class TareaDetallePage extends StatefulWidget {
  const TareaDetallePage({
    super.key,
    required this.id,
    required this.acciones,
    this.plantillasApi,
    this.organizacionesApi,
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
  late List<ResponsableCandidato> _miembros = widget.args.responsables;
  TareaDto? _tareaPrincipal;
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
      padding: const EdgeInsets.only(top: 4, bottom: 48),
      children: <Widget>[
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 14),
          child: Text(
            tarea.titulo,
            style: textTheme.headlineMedium?.copyWith(
              decoration: completada ? TextDecoration.lineThrough : null,
              color: completada ? colores.tintaTenue : null,
            ),
          ),
        ),
        if (tarea.bloqueada)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
            child: _AvisoBloqueada(tituloPrincipal: _tareaPrincipal?.titulo),
          ),
        if (puedeMarcar)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 18),
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
        TarjetaSeccion(
          titulo: 'Detalles',
          divisorIndent: 62,
          children: <Widget>[
            _Dato(
              icono: LucideIcons.flag,
              etiqueta: 'Estado',
              valor: tarea.estado.etiqueta,
            ),
            _Dato(
              icono: LucideIcons.circleAlert,
              colorIcono: tarea.prioridad == PrioridadTarea.alta
                  ? colores.rosePeligro
                  : null,
              fondoIcono: tarea.prioridad == PrioridadTarea.alta
                  ? colores.roseSuave
                  : null,
              etiqueta: 'Prioridad',
              valor: tarea.prioridad.etiqueta,
            ),
            _Dato(
              icono: LucideIcons.calendar,
              etiqueta: 'Fechas',
              valor:
                  '${tarea.fechaInicio ?? 'Sin inicio'} → ${tarea.fechaVencimiento ?? 'Sin vencimiento'}',
            ),
            if (tarea.recurrencia != null)
              _Dato(
                icono: LucideIcons.repeat,
                colorIcono: colores.indigoMarca,
                fondoIcono: colores.indigoSuave,
                etiqueta: 'Repetición',
                valor: tarea.recurrencia!.etiqueta,
              ),
            if (tarea.dependeDeId != null)
              _Dato(
                icono: LucideIcons.link,
                etiqueta: 'Depende de',
                valor: _tareaPrincipal?.titulo ?? 'Tarea #${tarea.dependeDeId}',
                trailing: Icon(
                  LucideIcons.chevronRight,
                  size: 18,
                  color: colores.tintaTenue,
                ),
                onTap: () => context.push('/tareas/${tarea.dependeDeId}'),
              ),
            if (nombresResponsables.isNotEmpty)
              _Dato(
                icono: LucideIcons.users,
                etiqueta: 'Responsables',
                valor: nombresResponsables.join(', '),
              ),
            if (tarea.isCompartida)
              const _Dato(
                icono: LucideIcons.share2,
                etiqueta: 'Ámbito',
                valor: 'Compartida',
              ),
            if (tagsTarea.isNotEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                child: Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: <Widget>[
                    for (final tag in tagsTarea)
                      InsigniaPill(
                        texto: tag.nombre,
                        icono: LucideIcons.tag,
                      ),
                  ],
                ),
              ),
          ],
        ),
        if (tarea.subtareas.isNotEmpty) ...<Widget>[
          const SizedBox(height: 18),
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
        const SizedBox(height: 18),
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
        const SizedBox(height: 18),
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
        const SizedBox(height: 18),
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
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: colores.amberSuave,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: colores.amberAviso.withValues(alpha: 0.35)),
      ),
      child: Row(
        children: <Widget>[
          Icon(LucideIcons.lock, size: 18, color: colores.amberAviso),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              texto,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: colores.tinta,
                fontWeight: FontWeight.w500,
              ),
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
    this.colorIcono,
    this.fondoIcono,
    this.trailing,
    this.onTap,
  });

  final IconData icono;
  final String etiqueta;
  final String valor;
  final Color? colorIcono;
  final Color? fondoIcono;
  final Widget? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      dense: true,
      leading: IconoCaja(
        icono: icono,
        color: colorIcono,
        fondo: fondoIcono,
        dimension: 32,
        tamanoIcono: 16,
      ),
      title: Text(etiqueta, style: Theme.of(context).textTheme.bodySmall),
      subtitle: Text(
        valor,
        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
          fontWeight: FontWeight.w500,
        ),
      ),
      trailing: trailing,
      onTap: onTap,
    );
  }
}
