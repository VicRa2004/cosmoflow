import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/auth/sesion_store.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/avisos.dart';
import '../../../core/widgets/confirmar.dart';
import '../../../core/widgets/estados.dart';
import '../../notas/api/notas_api.dart';
import '../../notas/pages/notas_page.dart';
import '../../tags/api/tags_api.dart';
import '../../tags/models/tag_model.dart';
import '../../tareas/api/tareas_api.dart';
import '../../tareas/pages/tareas_page.dart';
import '../api/organizaciones_api.dart';
import '../models/organizacion_models.dart';
import 'proyecto_editor_page.dart';

/// Argumentos para abrir `/organizaciones/:id/proyectos/:proyectoId`.
class ProyectoDetalleArgs {
  const ProyectoDetalleArgs({
    this.organizacion,
    this.proyecto,
    this.miembros = const <MiembroDto>[],
    this.equipos = const <EquipoDto>[],
    this.tags = const <TagDto>[],
  });

  final OrganizacionDto? organizacion;
  final ProyectoDto? proyecto;
  final List<MiembroDto> miembros;
  final List<EquipoDto> equipos;
  final List<TagDto> tags;

  static ProyectoDetalleArgs fromExtra(Object? extra) {
    if (extra is ProyectoDetalleArgs) return extra;
    if (extra is ProyectoDto) return ProyectoDetalleArgs(proyecto: extra);
    return const ProyectoDetalleArgs();
  }
}

/// Vista `/organizaciones/:id/proyectos/:proyectoId`: tareas y notas del proyecto.
class ProyectoDetallePage extends StatefulWidget {
  const ProyectoDetallePage({
    super.key,
    required this.organizacionId,
    required this.proyectoId,
    required this.sesionStore,
    required this.organizacionesApi,
    required this.tareasApi,
    required this.notasApi,
    required this.tagsApi,
    this.args = const ProyectoDetalleArgs(),
    this.cargarAlIniciar = true,
  });

  final int organizacionId;
  final int proyectoId;
  final SesionStore sesionStore;
  final OrganizacionesApi organizacionesApi;
  final TareasApi tareasApi;
  final NotasApi notasApi;
  final TagsApi tagsApi;
  final ProyectoDetalleArgs args;
  final bool cargarAlIniciar;

  @override
  State<ProyectoDetallePage> createState() => _ProyectoDetallePageState();
}

class _ProyectoDetallePageState extends State<ProyectoDetallePage> {
  late OrganizacionDto? _organizacion = widget.args.organizacion;
  late ProyectoDto? _proyecto = widget.args.proyecto;
  late List<MiembroDto> _miembros = widget.args.miembros;
  late List<EquipoDto> _equipos = widget.args.equipos;
  late List<TagDto> _tags = widget.args.tags;
  String? _mensajeError;

  @override
  void initState() {
    super.initState();
    if (widget.cargarAlIniciar &&
        (_organizacion == null || _proyecto == null || _miembros.isEmpty)) {
      _cargarContexto();
    }
  }

  Future<void> _cargarContexto() async {
    try {
      final res = await Future.wait<dynamic>(<Future<dynamic>>[
        widget.organizacionesApi.obtenerUna(widget.organizacionId),
        widget.organizacionesApi.obtenerProyectos(widget.organizacionId),
        widget.organizacionesApi.obtenerMiembros(widget.organizacionId),
        widget.organizacionesApi.obtenerEquipos(widget.organizacionId),
        widget.tagsApi.obtenerTodos(organizacionId: widget.organizacionId),
      ]);
      if (!mounted) return;
      final proyectos = res[1] as List<ProyectoDto>;
      setState(() {
        _organizacion = res[0] as OrganizacionDto;
        _proyecto =
            proyectos.where((p) => p.id == widget.proyectoId).firstOrNull ??
            _proyecto;
        _miembros = res[2] as List<MiembroDto>;
        _equipos = res[3] as List<EquipoDto>;
        _tags = (res[4] as PaginaTags).datos;
        _mensajeError = _proyecto == null
            ? 'No se encontró el proyecto.'
            : null;
      });
    } catch (_) {
      if (mounted && _proyecto == null) {
        setState(() => _mensajeError = 'No se pudo cargar el proyecto.');
      }
    }
  }

  Future<void> _editarProyecto(ProyectoDto proyecto) async {
    final guardado = await context.push<bool>(
      '/organizaciones/${widget.organizacionId}/proyectos/${proyecto.id}/editar',
      extra: ProyectoEditorArgs(
        proyecto: proyecto,
        equipos: _equipos,
        miembros: _miembros,
      ),
    );
    if (guardado == true && mounted) await _cargarContexto();
  }

  Future<void> _eliminarProyecto(ProyectoDto proyecto) async {
    final ok = await confirmar(
      context,
      titulo: '¿Eliminar el proyecto «${proyecto.nombre}»?',
      mensaje: 'Sus tareas pasan a la organización y sus notas, a quien las creó. Sus equipos e integrantes siguen en la organización.',
      accion: 'Eliminar',
    );
    if (!ok || !mounted) return;
    final eliminado = await ejecutarConAviso(
      context,
      () => widget.organizacionesApi.eliminarProyecto(
        widget.organizacionId,
        proyecto.id,
      ),
      error: 'No se pudo eliminar el proyecto.',
      exito: 'Proyecto eliminado',
    );
    if (eliminado && mounted) context.pop(true);
  }

  Widget _encabezado(BuildContext context, ProyectoDto proyecto) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final prog = proyecto.progreso;
    final metadatos = <String>[
      proyecto.estado.etiqueta,
      if (prog.tareas > 0) '${prog.completadas}/${prog.tareas} completadas',
      if (proyecto.fechaFin != null && proyecto.fechaFin!.isNotEmpty)
        'Entrega ${proyecto.fechaFin}',
    ].join(' · ');

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            metadatos,
            style: textTheme.bodySmall?.copyWith(color: colores.tintaTenue),
          ),
          if (proyecto.descripcion.trim().isNotEmpty) ...<Widget>[
            const SizedBox(height: 4),
            Text(
              proyecto.descripcion.trim(),
              style: textTheme.bodyMedium?.copyWith(color: colores.tintaSuave),
            ),
          ],
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final proyecto = _proyecto;
    if (proyecto == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Proyecto')),
        body: _mensajeError == null
            ? const EstadoCargando()
            : EstadoError(
                mensaje: _mensajeError!,
                onReintentar: _cargarContexto,
              ),
      );
    }

    final colores = context.colores;
    final puedeEditar = _organizacion?.puede('proyectos:editar') ?? false;
    final puedeEliminar = _organizacion?.puede('proyectos:eliminar') ?? false;
    final responsables = filtrarMiembrosDestino(
      miembros: _miembros,
      equipos: _equipos,
      proyectos: <ProyectoDto>[proyecto],
      proyectoId: proyecto.id,
    );

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: Text(proyecto.nombre),
          actions: <Widget>[
            if (puedeEditar || puedeEliminar)
              PopupMenuButton<String>(
                onSelected: (accion) {
                  if (accion == 'editar') _editarProyecto(proyecto);
                  if (accion == 'eliminar') _eliminarProyecto(proyecto);
                },
                itemBuilder: (_) => <PopupMenuEntry<String>>[
                  if (puedeEditar)
                    const PopupMenuItem<String>(
                      value: 'editar',
                      child: Text('Editar proyecto'),
                    ),
                  if (puedeEliminar)
                    PopupMenuItem<String>(
                      value: 'eliminar',
                      child: Text(
                        'Eliminar proyecto',
                        style: TextStyle(color: colores.rosePeligro),
                      ),
                    ),
                ],
              ),
          ],
          bottom: const TabBar(
            tabs: <Widget>[
              Tab(text: 'Tareas'),
              Tab(text: 'Notas'),
            ],
          ),
        ),
        body: TabBarView(
          children: <Widget>[
            TareasPage(
              sesionStore: widget.sesionStore,
              tareasApi: widget.tareasApi,
              organizacionId: widget.organizacionId,
              proyectoId: proyecto.id,
              tags: _tags,
              responsables: responsables,
              mostrarAppBar: false,
              encabezadoExtra: _encabezado(context, proyecto),
              cargarAlIniciar: widget.cargarAlIniciar,
            ),
            NotasPage(
              sesionStore: widget.sesionStore,
              notasApi: widget.notasApi,
              tagsApi: widget.tagsApi,
              proyectoId: proyecto.id,
              organizacionId: widget.organizacionId,
              mostrarAppBar: false,
              cargarAlIniciar: widget.cargarAlIniciar,
            ),
          ],
        ),
      ),
    );
  }
}
