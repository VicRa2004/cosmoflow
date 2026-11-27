import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/auth/sesion_store.dart';
import '../../../core/offline/aviso_pendientes.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/estados.dart';
import '../../../core/widgets/tarjeta_seccion.dart';
import '../../organizaciones/api/organizaciones_api.dart';
import '../../organizaciones/services/contexto_organizacion_cache.dart';
import '../../tags/models/tag_model.dart';
import '../acciones_tarea.dart';
import '../api/tareas_api.dart';
import '../models/tarea_model.dart';
import '../widgets/selector_destino_tarea_sheet.dart';
import '../widgets/tablero_tareas.dart';
import '../widgets/tarea_fila.dart';
import '../widgets/tarea_form.dart';

/// Vista `/tareas` (o lista/tablero de tareas de organización, equipo o proyecto).
class TareasPage extends StatefulWidget {
  const TareasPage({
    super.key,
    required this.sesionStore,
    required this.tareasApi,
    this.organizacionesApi,
    this.organizacionId,
    this.equipoId,
    this.proyectoId,
    this.tags = const <TagDto>[],
    this.responsables = const <ResponsableCandidato>[],
    this.puedeCrear,
    this.mostrarAppBar = true,
    this.encabezadoExtra,
    this.cargarAlIniciar = true,
  });

  final SesionStore sesionStore;
  final TareasApi tareasApi;
  final OrganizacionesApi? organizacionesApi;
  final int? organizacionId;
  final int? equipoId;
  final int? proyectoId;
  final List<TagDto> tags;
  final List<ResponsableCandidato> responsables;
  final bool? puedeCrear;
  final bool mostrarAppBar;
  final Widget? encabezadoExtra;
  final bool cargarAlIniciar;

  @override
  State<TareasPage> createState() => _TareasPageState();
}

class _TareasPageState extends State<TareasPage> {
  static const int _limiteTablero = 200;

  final _busqueda = TextEditingController();
  late final ContextoOrganizacionCache? _contextoCache =
      widget.organizacionesApi == null
      ? null
      : ContextoOrganizacionCache(organizacionesApi: widget.organizacionesApi!);
  List<TareaDto> _tareas = const <TareaDto>[];
  Map<int, UbicacionTarea> _ubicaciones = const <int, UbicacionTarea>{};
  int _totalElementos = 0;
  EstadoTarea? _filtroEstado;
  bool _soloAsignadas = false;
  bool _soloFijadas = false;
  bool _enTablero = false;
  bool _isCargando = false;
  String? _mensajeError;

  AccionesTarea get _acciones => AccionesTarea(
    sesionStore: widget.sesionStore,
    tareasApi: widget.tareasApi,
    organizacionId: widget.organizacionId,
    equipoId: widget.equipoId,
    proyectoId: widget.proyectoId,
    tags: widget.tags,
    responsables: widget.responsables,
  );

  @override
  void initState() {
    super.initState();
    if (widget.cargarAlIniciar) _cargar();
  }

  @override
  void dispose() {
    _busqueda.dispose();
    super.dispose();
  }

  List<TareaDto> _ordenarFijadasPrimero(List<TareaDto> lista) {
    final fijadas = lista.where((t) => t.isFijada);
    final normales = lista.where((t) => !t.isFijada);
    return <TareaDto>[...fijadas, ...normales];
  }

  Future<void> _cargar() async {
    setState(() {
      _isCargando = true;
      _mensajeError = null;
    });
    try {
      final pagina = await widget.tareasApi.obtenerTodos(
        limite: _enTablero ? _limiteTablero : 25,
        busqueda: _busqueda.text,
        estado: _enTablero ? null : _filtroEstado,
        asignadas: _soloAsignadas,
        fijada: _soloFijadas ? true : null,
        organizacionId: widget.organizacionId,
        equipoId: widget.equipoId,
        proyectoId: widget.proyectoId,
      );
      if (mounted) {
        setState(() {
          _tareas = _ordenarFijadasPrimero(pagina.datos);
          _totalElementos = pagina.totalElementos;
        });
      }
      final cache = _contextoCache;
      if (cache != null && widget.organizacionId == null) {
        final mapa = await cache.resolverParaTareas(pagina.datos);
        if (mounted) setState(() => _ubicaciones = mapa);
      }
    } catch (_) {
      if (mounted) {
        setState(() => _mensajeError = 'No se pudieron cargar las tareas.');
      }
    } finally {
      if (mounted) setState(() => _isCargando = false);
    }
  }

  Future<void> _recargarSi(Future<bool> cambio) async {
    if (await cambio) await _cargar();
  }

  Future<void> _crearTarea() async {
    final orgApi = widget.organizacionesApi;
    if (widget.organizacionId != null || orgApi == null) {
      await _recargarSi(_acciones.crear(context));
      return;
    }
    final destino = await mostrarSelectorDestinoTarea(
      context,
      organizacionesApi: orgApi,
      usuarioId: widget.sesionStore.usuario?.id,
    );
    if (destino == null || !mounted) return;
    await _recargarSi(_acciones.crearEnDestino(context, destino));
  }

  void _alternarVista() {
    setState(() => _enTablero = !_enTablero);
    _cargar();
  }

  Widget _filtros() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        spacing: 8,
        children: <Widget>[
          if (!widget.mostrarAppBar)
            FilterChip(
              avatar: Icon(
                _enTablero ? LucideIcons.list : LucideIcons.columns3,
                size: 15,
              ),
              label: Text(_enTablero ? 'Lista' : 'Tablero'),
              selected: _enTablero,
              onSelected: (_) => _alternarVista(),
            ),
          FilterChip(
            avatar: const Icon(LucideIcons.pin, size: 15),
            label: const Text('Fijadas'),
            selected: _soloFijadas,
            onSelected: (v) {
              setState(() => _soloFijadas = v);
              _cargar();
            },
          ),
          FilterChip(
            label: const Text('Asignadas a mí'),
            selected: _soloAsignadas,
            onSelected: (v) {
              setState(() => _soloAsignadas = v);
              _cargar();
            },
          ),
          if (!_enTablero)
            for (final estado in EstadoTarea.values)
              ChoiceChip(
                label: Text(estado.etiqueta),
                selected: _filtroEstado == estado,
                onSelected: (sel) {
                  setState(() => _filtroEstado = sel ? estado : null);
                  _cargar();
                },
              ),
        ],
      ),
    );
  }

  Widget _cabeceraControles() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        if (widget.encabezadoExtra != null) widget.encabezadoExtra!,
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: SearchBar(
            controller: _busqueda,
            hintText: 'Buscar tarea',
            leading: Icon(
              LucideIcons.search,
              size: 18,
              color: context.colores.tintaTenue,
            ),
            textInputAction: TextInputAction.search,
            onSubmitted: (_) => _cargar(),
          ),
        ),
        _filtros(),
        const SizedBox(height: 12),
        avisoPendientes(
          cola: widget.tareasApi.cola,
          usuarioId: widget.sesionStore.usuario?.id,
          ruta: '/tareas',
          onSincronizado: _cargar,
        ),
      ],
    );
  }

  List<Widget> _listaAgrupada(bool puedeActualizar) {
    final fijadas = _tareas.where((t) => t.isFijada).toList(growable: false);
    final resto = _tareas.where((t) => !t.isFijada).toList(growable: false);

    Widget fila(TareaDto tarea) => TareaFila(
      tarea: tarea,
      ubicacion: widget.organizacionId == null ? _ubicaciones[tarea.id] : null,
      puedeActualizar: puedeActualizar,
      onTap: () => _recargarSi(
        _acciones.abrirDetalle(
          context,
          tarea,
          ubicacion: widget.organizacionId == null
              ? _ubicaciones[tarea.id]
              : null,
        ),
      ),
      onAlternarCompletada: () =>
          _recargarSi(_acciones.alternarCompletada(context, tarea)),
      onAlternarFijada: () =>
          _recargarSi(_acciones.alternarFijada(context, tarea)),
    );

    if (fijadas.isEmpty || resto.isEmpty) {
      return <Widget>[
        TarjetaSeccion(
          titulo: fijadas.isNotEmpty ? 'Fijadas' : null,
          contador: fijadas.isNotEmpty ? fijadas.length : null,
          colorTitulo: fijadas.isNotEmpty ? context.colores.indigoMarca : null,
          divisorIndent: 56,
          children: <Widget>[for (final t in _tareas) fila(t)],
        ),
      ];
    }

    return <Widget>[
      TarjetaSeccion(
        titulo: 'Fijadas',
        contador: fijadas.length,
        colorTitulo: context.colores.indigoMarca,
        divisorIndent: 56,
        children: <Widget>[for (final t in fijadas) fila(t)],
      ),
      const SizedBox(height: 18),
      TarjetaSeccion(
        titulo: 'Tareas',
        contador: resto.length,
        divisorIndent: 56,
        children: <Widget>[for (final t in resto) fila(t)],
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final puedeActualizar = widget.sesionStore.puede('tareas:actualizar');
    final permiteCrear =
        (widget.puedeCrear ?? true) && widget.sesionStore.puede('tareas:crear');
    final heroSuffix =
        widget.proyectoId ?? widget.equipoId ?? widget.organizacionId ?? 0;

    return Scaffold(
      appBar: widget.mostrarAppBar
          ? AppBar(
              title: const Text('Tareas'),
              actions: <Widget>[
                IconButton(
                  tooltip: _enTablero ? 'Vista de lista' : 'Vista de tablero',
                  icon: Icon(
                    _enTablero ? LucideIcons.list : LucideIcons.columns3,
                  ),
                  onPressed: _alternarVista,
                ),
                IconButton(
                  tooltip: 'Calendario',
                  icon: const Icon(LucideIcons.calendar),
                  onPressed: () => context.push('/calendario'),
                ),
              ],
            )
          : null,
      floatingActionButton: permiteCrear
          ? FloatingActionButton(
              heroTag: 'fab-tareas-$heroSuffix',
              tooltip: 'Nueva tarea',
              onPressed: _crearTarea,
              child: const Icon(LucideIcons.plus),
            )
          : null,
      body: _enTablero
          ? Column(
              children: <Widget>[
                _cabeceraControles(),
                Expanded(
                  child: _isCargando
                      ? const EstadoCargando()
                      : _mensajeError != null
                      ? EstadoError(
                          mensaje: _mensajeError!,
                          onReintentar: _cargar,
                        )
                      : TableroTareas(
                          tareas: _tareas,
                          puedeActualizar: puedeActualizar,
                          totalElementos: _totalElementos,
                          onAbrir: (tarea) => _recargarSi(
                            _acciones.abrirDetalle(context, tarea),
                          ),
                          onMoverEstado: (tarea, estado) => _recargarSi(
                            _acciones.cambiarEstado(context, tarea, estado),
                          ),
                          onAlternarFijada: (tarea) => _recargarSi(
                            _acciones.alternarFijada(context, tarea),
                          ),
                        ),
                ),
              ],
            )
          : RefreshIndicator(
              onRefresh: _cargar,
              child: ListView(
                padding: const EdgeInsets.only(bottom: 104),
                children: <Widget>[
                  _cabeceraControles(),
                  if (_isCargando)
                    const EstadoCargando()
                  else if (_mensajeError != null)
                    EstadoError(mensaje: _mensajeError!, onReintentar: _cargar)
                  else if (_tareas.isEmpty)
                    const EstadoVacio(
                      icono: LucideIcons.circleCheck,
                      titulo: 'Sin tareas',
                      mensaje: 'No hay tareas que coincidan con los filtros.',
                    )
                  else
                    ..._listaAgrupada(puedeActualizar),
                ],
              ),
            ),
    );
  }
}
