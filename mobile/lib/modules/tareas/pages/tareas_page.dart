import 'package:go_router/go_router.dart';
import 'package:flutter/material.dart';

import '../../../core/auth/sesion_store.dart';
import '../../../core/offline/aviso_pendientes.dart';
import '../../../core/widgets/estados.dart';
import '../../tags/models/tag_model.dart';
import '../acciones_tarea.dart';
import '../api/tareas_api.dart';
import '../models/tarea_model.dart';
import '../widgets/tarea_fila.dart';
import '../widgets/tarea_form.dart';

/// Vista `/tareas` (o lista de tareas de organización, equipo o proyecto).
class TareasPage extends StatefulWidget {
  const TareasPage({
    super.key,
    required this.sesionStore,
    required this.tareasApi,
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
  final _busqueda = TextEditingController();
  List<TareaDto> _tareas = const <TareaDto>[];
  EstadoTarea? _filtroEstado;
  bool _soloAsignadas = false;
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

  Future<void> _cargar() async {
    setState(() {
      _isCargando = true;
      _mensajeError = null;
    });
    try {
      final pagina = await widget.tareasApi.obtenerTodos(
        busqueda: _busqueda.text,
        estado: _filtroEstado,
        asignadas: _soloAsignadas,
        organizacionId: widget.organizacionId,
        equipoId: widget.equipoId,
        proyectoId: widget.proyectoId,
      );
      if (mounted) setState(() => _tareas = pagina.datos);
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

  Widget _filtros() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        spacing: 8,
        children: <Widget>[
          FilterChip(
            label: const Text('Asignadas a mí'),
            selected: _soloAsignadas,
            onSelected: (v) {
              setState(() => _soloAsignadas = v);
              _cargar();
            },
          ),
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
                  tooltip: 'Calendario',
                  icon: const Icon(Icons.calendar_month_outlined),
                  onPressed: () => context.push('/calendario'),
                ),
              ],
            )
          : null,
      floatingActionButton: permiteCrear
          ? FloatingActionButton(
              heroTag: 'fab-tareas-$heroSuffix',
              tooltip: 'Nueva tarea',
              onPressed: () => _recargarSi(_acciones.crear(context)),
              child: const Icon(Icons.add_rounded),
            )
          : null,
      body: RefreshIndicator(
        onRefresh: _cargar,
        child: ListView(
          padding: const EdgeInsets.only(bottom: 96),
          children: <Widget>[
            if (widget.encabezadoExtra != null) widget.encabezadoExtra!,
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
              child: SearchBar(
                controller: _busqueda,
                hintText: 'Buscar tarea',
                leading: const Icon(Icons.search_rounded),
                elevation: const WidgetStatePropertyAll<double>(0),
                textInputAction: TextInputAction.search,
                onSubmitted: (_) => _cargar(),
              ),
            ),
            _filtros(),
            const SizedBox(height: 8),
            avisoPendientes(
              cola: widget.tareasApi.cola,
              usuarioId: widget.sesionStore.usuario?.id,
              ruta: '/tareas',
              onSincronizado: _cargar,
            ),
            if (_isCargando)
              const EstadoCargando()
            else if (_mensajeError != null)
              EstadoError(mensaje: _mensajeError!, onReintentar: _cargar)
            else if (_tareas.isEmpty)
              const EstadoVacio(
                icono: Icons.task_alt_rounded,
                titulo: 'Sin tareas',
                mensaje: 'No hay tareas que coincidan con los filtros.',
              )
            else
              for (final tarea in _tareas) ...<Widget>[
                TareaFila(
                  tarea: tarea,
                  puedeActualizar: puedeActualizar,
                  onTap: () =>
                      _recargarSi(_acciones.abrirDetalle(context, tarea)),
                  onAlternarCompletada: () =>
                      _recargarSi(_acciones.alternarCompletada(context, tarea)),
                ),
                const Divider(indent: 56),
              ],
          ],
        ),
      ),
    );
  }
}
