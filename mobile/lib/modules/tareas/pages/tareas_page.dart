import 'package:flutter/material.dart';
import '../../../core/auth/sesion_store.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../api/tareas_api.dart';
import '../models/tarea_model.dart';
import '../widgets/tarea_card.dart';
import '../widgets/tarea_detalle_sheet.dart';
import '../widgets/tarea_form_dialog.dart';

/// Vista `/tareas` con buscador, filtros por estado / asignadas, lectura y edición.
class TareasPage extends StatefulWidget {
  const TareasPage({
    super.key,
    required this.sesionStore,
    required this.tareasApi,
    this.cargarAlIniciar = true,
  });

  final SesionStore sesionStore;
  final TareasApi tareasApi;
  final bool cargarAlIniciar;

  @override
  State<TareasPage> createState() => _TareasPageState();
}

class _TareasPageState extends State<TareasPage> {
  final TextEditingController _busquedaController = TextEditingController();

  List<TareaDto> _tareas = const <TareaDto>[];
  EstadoTarea? _filtroEstado;
  bool _soloAsignadas = false;
  bool _isCargando = false;
  String? _mensajeError;

  @override
  void initState() {
    super.initState();
    if (widget.cargarAlIniciar) {
      _cargarTareas();
    }
  }

  @override
  void dispose() {
    _busquedaController.dispose();
    super.dispose();
  }

  Future<void> _cargarTareas() async {
    setState(() {
      _isCargando = true;
      _mensajeError = null;
    });

    try {
      final pagina = await widget.tareasApi.obtenerTodos(
        busqueda: _busquedaController.text,
        estado: _filtroEstado,
        asignadas: _soloAsignadas,
      );
      if (mounted) {
        setState(() {
          _tareas = pagina.datos;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _mensajeError = 'No se pudieron cargar las tareas.';
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isCargando = false;
        });
      }
    }
  }

  Future<void> _crearTarea() async {
    final valores = await showDialog<TareaFormValores>(
      context: context,
      builder: (_) => const TareaFormDialog(),
    );
    if (valores == null) return;

    await widget.tareasApi.crear(
      titulo: valores.titulo,
      contenido: valores.contenido,
      estado: valores.estado,
      prioridad: valores.prioridad,
      fechaInicio: valores.fechaInicio,
      fechaVencimiento: valores.fechaVencimiento,
    );
    await _cargarTareas();
  }

  Future<void> _alternarCompletada(TareaDto tarea) async {
    await widget.tareasApi.alternarCompletada(tarea);
    await _cargarTareas();
  }

  Future<void> _abrirDetalle(TareaDto tarea) async {
    final colores = context.colores;
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: colores.superficie,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(8)),
      ),
      builder: (sheetContext) => TareaDetalleSheet(
        tarea: tarea,
        puedeActualizar: widget.sesionStore.puede('tareas:actualizar'),
        puedeEliminar: widget.sesionStore.puede('tareas:eliminar'),
        onEditar: () async {
          Navigator.of(sheetContext).pop();
          final valores = await showDialog<TareaFormValores>(
            context: context,
            builder: (_) => TareaFormDialog(tareaInicial: tarea),
          );
          if (valores == null) return;
          await widget.tareasApi.actualizar(
            tarea.id,
            <String, dynamic>{
              'titulo': valores.titulo,
              'contenido': valores.contenido,
              'estado': valores.estado.valorApi,
              'prioridad': valores.prioridad.valorApi,
              'fechaInicio':
                  valores.fechaInicio != null && valores.fechaInicio!.isNotEmpty
                      ? valores.fechaInicio
                      : null,
              'fechaVencimiento': valores.fechaVencimiento != null &&
                      valores.fechaVencimiento!.isNotEmpty
                  ? valores.fechaVencimiento
                  : null,
            },
          );
          await _cargarTareas();
        },
        onEliminar: () async {
          Navigator.of(sheetContext).pop();
          await widget.tareasApi.eliminar(tarea.id);
          await _cargarTareas();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final puedeCrear = widget.sesionStore.puede('tareas:crear');
    final puedeActualizar = widget.sesionStore.puede('tareas:actualizar');

    return RefreshIndicator(
      onRefresh: _cargarTareas,
      child: ListView(
        padding: const EdgeInsets.all(24),
        children: <Widget>[
          Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 12,
            runSpacing: 12,
            children: <Widget>[
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text('Tareas', style: textTheme.headlineSmall),
                  const SizedBox(height: 4),
                  Text(
                    'Gestiona tus tareas personales y asignadas.',
                    style: textTheme.bodyMedium?.copyWith(
                      color: colores.tintaTenue,
                    ),
                  ),
                ],
              ),
              if (puedeCrear)
                FilledButton.icon(
                  onPressed: _crearTarea,
                  icon: const Icon(Icons.add_rounded, size: 18),
                  label: const Text('Nueva tarea'),
                ),
            ],
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _busquedaController,
            textInputAction: TextInputAction.search,
            onSubmitted: (_) => _cargarTareas(),
            decoration: InputDecoration(
              hintText: 'Buscar tarea...',
              prefixIcon: Icon(
                Icons.search_rounded,
                size: 18,
                color: colores.tintaTenue,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: <Widget>[
              FilterChip(
                label: const Text('Asignadas a mí'),
                selected: _soloAsignadas,
                onSelected: (valor) {
                  setState(() => _soloAsignadas = valor);
                  _cargarTareas();
                },
              ),
              for (final estado in EstadoTarea.values)
                ChoiceChip(
                  label: Text(estado.etiqueta),
                  selected: _filtroEstado == estado,
                  onSelected: (seleccionado) {
                    setState(() {
                      _filtroEstado = seleccionado ? estado : null;
                    });
                    _cargarTareas();
                  },
                ),
            ],
          ),
          const SizedBox(height: 20),
          if (_isCargando)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 40),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_mensajeError != null)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: <Widget>[
                    Text(
                      _mensajeError!,
                      style: textTheme.bodyMedium?.copyWith(
                        color: colores.rosePeligro,
                      ),
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton(
                      onPressed: _cargarTareas,
                      child: const Text('Reintentar'),
                    ),
                  ],
                ),
              ),
            )
          else if (_tareas.isEmpty)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: <Widget>[
                    Icon(
                      Icons.checklist_rounded,
                      size: 32,
                      color: colores.tintaTenue,
                    ),
                    const SizedBox(height: 12),
                    Text('Sin tareas', style: textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text(
                      'No hay tareas que coincidan con los filtros seleccionados.',
                      textAlign: TextAlign.center,
                      style: textTheme.bodyMedium?.copyWith(
                        color: colores.tintaTenue,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            for (final tarea in _tareas) ...<Widget>[
              TareaCard(
                tarea: tarea,
                mostrarEstado: true,
                puedeActualizar: puedeActualizar,
                onTap: () => _abrirDetalle(tarea),
                onAlternarCompletada: () => _alternarCompletada(tarea),
              ),
              const SizedBox(height: 10),
            ],
        ],
      ),
    );
  }
}
