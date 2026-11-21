import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/auth/sesion_store.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/avisos.dart';
import '../../../core/widgets/confirmar.dart';
import '../../../core/widgets/estados.dart';
import '../../tags/api/tags_api.dart';
import '../../tags/models/tag_model.dart';
import '../../tags/pages/tags_page.dart';
import '../../tareas/api/tareas_api.dart';
import '../../tareas/pages/tareas_page.dart';
import '../api/organizaciones_api.dart';
import '../models/organizacion_models.dart';
import '../widgets/listas_organizacion.dart';
import 'equipo_detalle_page.dart';
import 'equipo_editor_page.dart';
import 'proyecto_detalle_page.dart';
import 'proyecto_editor_page.dart';

/// Vista `/organizaciones/:id` con pestañas de Proyectos, Equipos, Tareas y Tags.
class OrganizacionDetallePage extends StatefulWidget {
  const OrganizacionDetallePage({
    super.key,
    required this.id,
    required this.sesionStore,
    required this.organizacionesApi,
    required this.tareasApi,
    required this.tagsApi,
    this.organizacion,
    this.cargarAlIniciar = true,
  });

  final int id;
  final SesionStore sesionStore;
  final OrganizacionesApi organizacionesApi;
  final TareasApi tareasApi;
  final TagsApi tagsApi;
  final OrganizacionDto? organizacion;
  final bool cargarAlIniciar;

  @override
  State<OrganizacionDetallePage> createState() =>
      _OrganizacionDetallePageState();
}

class _OrganizacionDetallePageState extends State<OrganizacionDetallePage> {
  late OrganizacionDto? _organizacion = widget.organizacion;
  List<ProyectoDto> _proyectos = const <ProyectoDto>[];
  List<EquipoDto> _equipos = const <EquipoDto>[];
  List<MiembroDto> _miembros = const <MiembroDto>[];
  List<TagDto> _tags = const <TagDto>[];
  bool _isCargando = false;
  String? _mensajeError;

  @override
  void initState() {
    super.initState();
    if (widget.cargarAlIniciar) _cargar();
  }

  Future<void> _cargar() async {
    setState(() {
      _isCargando = true;
      _mensajeError = null;
    });
    try {
      final res = await Future.wait<dynamic>(<Future<dynamic>>[
        widget.organizacionesApi.obtenerUna(widget.id),
        widget.organizacionesApi.obtenerProyectos(widget.id),
        widget.organizacionesApi.obtenerEquipos(widget.id),
        widget.organizacionesApi.obtenerMiembros(widget.id),
        widget.tagsApi.obtenerTodos(organizacionId: widget.id),
      ]);
      if (!mounted) return;
      setState(() {
        _organizacion = res[0] as OrganizacionDto;
        _proyectos = res[1] as List<ProyectoDto>;
        _equipos = res[2] as List<EquipoDto>;
        _miembros = res[3] as List<MiembroDto>;
        _tags = (res[4] as PaginaTags).datos;
      });
    } catch (_) {
      if (mounted) {
        setState(() => _mensajeError = 'No se pudo cargar la organización.');
      }
    } finally {
      if (mounted) setState(() => _isCargando = false);
    }
  }

  Future<void> _editarOrganizacion(OrganizacionDto org) async {
    final guardado = await context.push<bool>(
      '/organizaciones/${org.id}/editar',
      extra: org,
    );
    if (guardado == true && mounted) await _cargar();
  }

  Future<void> _eliminarOrganizacion(OrganizacionDto org) async {
    final ok = await confirmar(
      context,
      titulo: '¿Eliminar «${org.nombre}»?',
      mensaje: 'Ningún miembro podrá volver a verla. Solo se recupera desde la base de datos.',
      accion: 'Eliminar',
    );
    if (!ok || !mounted) return;
    final eliminado = await ejecutarConAviso(
      context,
      () => widget.organizacionesApi.eliminar(org.id),
      error: 'No se pudo eliminar la organización.',
      exito: 'Organización eliminada',
    );
    if (eliminado && mounted) context.pop(true);
  }

  Future<void> _crearProyecto() async {
    final creado = await context.push<bool>(
      '/organizaciones/${widget.id}/proyectos/nuevo',
      extra: ProyectoEditorArgs(equipos: _equipos, miembros: _miembros),
    );
    if (creado == true && mounted) await _cargar();
  }

  Future<void> _abrirProyecto(ProyectoDto proyecto) async {
    await context.push<bool>(
      '/organizaciones/${widget.id}/proyectos/${proyecto.id}',
      extra: ProyectoDetalleArgs(
        organizacion: _organizacion,
        proyecto: proyecto,
        miembros: _miembros,
        equipos: _equipos,
        tags: _tags,
      ),
    );
    if (mounted) await _cargar();
  }

  Future<void> _crearEquipo() async {
    final creado = await context.push<bool>(
      '/organizaciones/${widget.id}/equipos/nuevo',
      extra: EquipoEditorArgs(miembros: _miembros, tags: _tags),
    );
    if (creado == true && mounted) await _cargar();
  }

  Future<void> _abrirEquipo(EquipoDto equipo) async {
    await context.push<bool>(
      '/organizaciones/${widget.id}/equipos/${equipo.id}',
      extra: EquipoDetalleArgs(
        organizacion: _organizacion,
        equipo: equipo,
        miembros: _miembros,
        tags: _tags,
      ),
    );
    if (mounted) await _cargar();
  }

  @override
  Widget build(BuildContext context) {
    final org = _organizacion;
    if (org == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Organización')),
        body: _isCargando
            ? const EstadoCargando()
            : EstadoError(
                mensaje: _mensajeError ?? 'No se pudo cargar la organización.',
                onReintentar: _cargar,
              ),
      );
    }

    final colores = context.colores;
    final puedeEditarOrg = org.puede('organizacion:editar');
    final puedeEliminarOrg = org.isAdmin;
    final responsablesOrg = filtrarMiembrosDestino(miembros: _miembros);

    return DefaultTabController(
      length: 4,
      child: Scaffold(
        appBar: AppBar(
          title: Text(org.nombre),
          actions: <Widget>[
            if (puedeEditarOrg || puedeEliminarOrg)
              PopupMenuButton<String>(
                onSelected: (accion) {
                  if (accion == 'editar') _editarOrganizacion(org);
                  if (accion == 'eliminar') _eliminarOrganizacion(org);
                },
                itemBuilder: (_) => <PopupMenuEntry<String>>[
                  if (puedeEditarOrg)
                    const PopupMenuItem<String>(
                      value: 'editar',
                      child: Text('Editar organización'),
                    ),
                  if (puedeEliminarOrg)
                    PopupMenuItem<String>(
                      value: 'eliminar',
                      child: Text(
                        'Eliminar organización',
                        style: TextStyle(color: colores.rosePeligro),
                      ),
                    ),
                ],
              ),
          ],
          bottom: const TabBar(
            tabs: <Widget>[
              Tab(text: 'Proyectos'),
              Tab(text: 'Equipos'),
              Tab(text: 'Tareas'),
              Tab(text: 'Tags'),
            ],
          ),
        ),
        body: _isCargando && _proyectos.isEmpty && _equipos.isEmpty
            ? const EstadoCargando()
            : _mensajeError != null && _proyectos.isEmpty && _equipos.isEmpty
            ? EstadoError(mensaje: _mensajeError!, onReintentar: _cargar)
            : TabBarView(
                children: <Widget>[
                  ListaProyectosOrganizacion(
                    proyectos: _proyectos,
                    onRefresh: _cargar,
                    onAbrirProyecto: _abrirProyecto,
                    onCrearProyecto: org.puede('proyectos:crear')
                        ? _crearProyecto
                        : null,
                  ),
                  ListaEquiposOrganizacion(
                    equipos: _equipos,
                    miembros: _miembros,
                    tags: _tags,
                    onRefresh: _cargar,
                    onAbrirEquipo: _abrirEquipo,
                    onCrearEquipo: org.puede('equipos:crear')
                        ? _crearEquipo
                        : null,
                  ),
                  TareasPage(
                    sesionStore: widget.sesionStore,
                    tareasApi: widget.tareasApi,
                    organizacionId: org.id,
                    tags: _tags,
                    responsables: responsablesOrg,
                    mostrarAppBar: false,
                    cargarAlIniciar: widget.cargarAlIniciar,
                  ),
                  TagsPage(
                    sesionStore: widget.sesionStore,
                    tagsApi: widget.tagsApi,
                    organizacionId: org.id,
                    puedeGestionar: org.puede('tags:gestionar'),
                    mostrarAppBar: false,
                    onTagsCambiados: (nuevos) {
                      if (mounted) setState(() => _tags = nuevos);
                    },
                    cargarAlIniciar: widget.cargarAlIniciar,
                  ),
                ],
              ),
      ),
    );
  }
}
