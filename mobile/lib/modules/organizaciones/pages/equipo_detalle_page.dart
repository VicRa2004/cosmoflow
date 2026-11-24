import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/auth/sesion_store.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/avisos.dart';
import '../../../core/widgets/confirmar.dart';
import '../../../core/widgets/estados.dart';
import '../../tags/api/tags_api.dart';
import '../../tags/models/tag_model.dart';
import '../../tareas/api/tareas_api.dart';
import '../../tareas/pages/tareas_page.dart';
import '../api/organizaciones_api.dart';
import '../models/organizacion_models.dart';
import '../widgets/delegados_sheet.dart';
import '../widgets/estadisticas_organizacion_tab.dart';
import 'equipo_editor_page.dart';

/// Argumentos para abrir `/organizaciones/:id/equipos/:equipoId`.
class EquipoDetalleArgs {
  const EquipoDetalleArgs({
    this.organizacion,
    this.equipo,
    this.miembros = const <MiembroDto>[],
    this.tags = const <TagDto>[],
  });

  final OrganizacionDto? organizacion;
  final EquipoDto? equipo;
  final List<MiembroDto> miembros;
  final List<TagDto> tags;

  static EquipoDetalleArgs fromExtra(Object? extra) {
    if (extra is EquipoDetalleArgs) return extra;
    if (extra is EquipoDto) return EquipoDetalleArgs(equipo: extra);
    return const EquipoDetalleArgs();
  }
}

/// Vista `/organizaciones/:id/equipos/:equipoId`: integrantes y tareas del equipo.
class EquipoDetallePage extends StatefulWidget {
  const EquipoDetallePage({
    super.key,
    required this.organizacionId,
    required this.equipoId,
    required this.sesionStore,
    required this.organizacionesApi,
    required this.tareasApi,
    required this.tagsApi,
    this.args = const EquipoDetalleArgs(),
    this.cargarAlIniciar = true,
  });

  final int organizacionId;
  final int equipoId;
  final SesionStore sesionStore;
  final OrganizacionesApi organizacionesApi;
  final TareasApi tareasApi;
  final TagsApi tagsApi;
  final EquipoDetalleArgs args;
  final bool cargarAlIniciar;

  @override
  State<EquipoDetallePage> createState() => _EquipoDetallePageState();
}

class _EquipoDetallePageState extends State<EquipoDetallePage> {
  late OrganizacionDto? _organizacion = widget.args.organizacion;
  late EquipoDto? _equipo = widget.args.equipo;
  late List<MiembroDto> _miembros = widget.args.miembros;
  late List<TagDto> _tags = widget.args.tags;
  String? _mensajeError;

  @override
  void initState() {
    super.initState();
    if (widget.cargarAlIniciar &&
        (_organizacion == null || _equipo == null || _miembros.isEmpty)) {
      _cargarContexto();
    }
  }

  Future<void> _cargarContexto() async {
    try {
      final res = await Future.wait<dynamic>(<Future<dynamic>>[
        widget.organizacionesApi.obtenerUna(widget.organizacionId),
        widget.organizacionesApi.obtenerEquipos(widget.organizacionId),
        widget.organizacionesApi.obtenerMiembros(widget.organizacionId),
        widget.tagsApi.obtenerTodos(organizacionId: widget.organizacionId),
      ]);
      if (!mounted) return;
      final equipos = res[1] as List<EquipoDto>;
      setState(() {
        _organizacion = res[0] as OrganizacionDto;
        _equipo =
            equipos.where((e) => e.id == widget.equipoId).firstOrNull ??
            _equipo;
        _miembros = res[2] as List<MiembroDto>;
        _tags = (res[3] as PaginaTags).datos;
        _mensajeError = _equipo == null ? 'No se encontró el equipo.' : null;
      });
    } catch (_) {
      if (mounted && _equipo == null) {
        setState(() => _mensajeError = 'No se pudo cargar el equipo.');
      }
    }
  }

  Future<void> _editarEquipo(EquipoDto equipo) async {
    final guardado = await context.push<bool>(
      '/organizaciones/${widget.organizacionId}/equipos/${equipo.id}/editar',
      extra: EquipoEditorArgs(equipo: equipo, miembros: _miembros, tags: _tags),
    );
    if (guardado == true && mounted) await _cargarContexto();
  }

  Future<void> _gestionarDelegados(EquipoDto equipo) async {
    final ids = await showModalBottomSheet<List<int>>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => DelegadosSheet(equipo: equipo, miembros: _miembros),
    );
    if (ids == null || !mounted) return;
    final ok = await ejecutarConAviso(
      context,
      () async {
        final actualizado = await widget.organizacionesApi.actualizarDelegados(
          widget.organizacionId,
          equipo.id,
          ids,
        );
        if (mounted) setState(() => _equipo = actualizado);
      },
      error: 'No se pudieron actualizar los delegados.',
      exito: 'Delegados actualizados',
    );
    if (ok && mounted) await _cargarContexto();
  }

  Future<void> _eliminarEquipo(EquipoDto equipo) async {
    final ok = await confirmar(
      context,
      titulo: '¿Eliminar el equipo «${equipo.nombre}»?',
      mensaje: 'Sus tareas pasan a la organización, con sus responsables. Sus miembros siguen en la organización.',
      accion: 'Eliminar',
    );
    if (!ok || !mounted) return;
    final eliminado = await ejecutarConAviso(
      context,
      () => widget.organizacionesApi.eliminarEquipo(
        widget.organizacionId,
        equipo.id,
      ),
      error: 'No se pudo eliminar el equipo.',
      exito: 'Equipo eliminado',
    );
    if (eliminado && mounted) context.pop(true);
  }

  Widget _encabezado(BuildContext context, EquipoDto equipo) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final integrantes = equipo.miembros
        .map((me) {
          final m = _miembros
              .where((x) => x.usuarioId == me.usuarioId)
              .firstOrNull;
          final nombre = m?.nombre ?? 'Usuario #${me.usuarioId}';
          final esLider = equipo.liderId == me.usuarioId;
          final esDelegado =
              !esLider && equipo.liderId != null && me.puedeCrearTareas;
          return (nombre: nombre, esLider: esLider, esDelegado: esDelegado);
        })
        .toList(growable: false);

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          if (equipo.descripcion.trim().isNotEmpty) ...<Widget>[
            Text(
              equipo.descripcion.trim(),
              style: textTheme.bodyMedium?.copyWith(color: colores.tintaSuave),
            ),
            const SizedBox(height: 8),
          ],
          if (integrantes.isNotEmpty)
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: <Widget>[
                for (final i in integrantes)
                  Chip(
                    visualDensity: VisualDensity.compact,
                    avatar: Icon(
                      i.esLider
                          ? Icons.star_rounded
                          : Icons.person_outline_rounded,
                      size: 16,
                    ),
                    label: Text(
                      i.esLider
                          ? '${i.nombre} · Líder'
                          : i.esDelegado
                          ? '${i.nombre} · Delegado'
                          : i.nombre,
                    ),
                  ),
              ],
            ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final equipo = _equipo;
    if (equipo == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Equipo')),
        body: _mensajeError == null
            ? const EstadoCargando()
            : EstadoError(
                mensaje: _mensajeError!,
                onReintentar: _cargarContexto,
              ),
      );
    }

    final colores = context.colores;
    final yo = widget.sesionStore.usuario?.id;
    final puedeEditar = _organizacion?.puede('equipos:editar') ?? false;
    final puedeEliminar = _organizacion?.puede('equipos:eliminar') ?? false;
    final puedeDelegados =
        equipo.liderId != null && (equipo.liderId == yo || puedeEditar);
    final hayMenu = puedeDelegados || puedeEditar || puedeEliminar;

    final responsables = filtrarMiembrosDestino(
      miembros: _miembros,
      equipos: <EquipoDto>[equipo],
      equipoId: equipo.id,
    );
    final puedeCrear = equipo.puedeCrearTareas(yo);

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: Text(equipo.nombre),
          actions: <Widget>[
            if (hayMenu)
              PopupMenuButton<String>(
                onSelected: (accion) {
                  if (accion == 'delegados') _gestionarDelegados(equipo);
                  if (accion == 'editar') _editarEquipo(equipo);
                  if (accion == 'eliminar') _eliminarEquipo(equipo);
                },
                itemBuilder: (_) => <PopupMenuEntry<String>>[
                  if (puedeDelegados)
                    const PopupMenuItem<String>(
                      value: 'delegados',
                      child: Text('Delegados'),
                    ),
                  if (puedeEditar)
                    const PopupMenuItem<String>(
                      value: 'editar',
                      child: Text('Editar equipo'),
                    ),
                  if (puedeEliminar)
                    PopupMenuItem<String>(
                      value: 'eliminar',
                      child: Text(
                        'Eliminar equipo',
                        style: TextStyle(color: colores.rosePeligro),
                      ),
                    ),
                ],
              ),
          ],
          bottom: const TabBar(
            tabs: <Widget>[
              Tab(text: 'Tareas'),
              Tab(text: 'Estadísticas'),
            ],
          ),
        ),
        body: TabBarView(
          children: <Widget>[
            TareasPage(
              sesionStore: widget.sesionStore,
              tareasApi: widget.tareasApi,
              organizacionId: widget.organizacionId,
              equipoId: equipo.id,
              tags: _tags,
              responsables: responsables,
              puedeCrear: puedeCrear,
              mostrarAppBar: false,
              encabezadoExtra: _encabezado(context, equipo),
              cargarAlIniciar: widget.cargarAlIniciar,
            ),
            EstadisticasDestinoTab(
              tareasApi: widget.tareasApi,
              miembros: _miembros,
              equipoId: equipo.id,
              tituloTareas: 'Tareas del equipo',
              onRefreshExtra: _cargarContexto,
              cargarAlIniciar: widget.cargarAlIniciar,
            ),
          ],
        ),
      ),
    );
  }
}
