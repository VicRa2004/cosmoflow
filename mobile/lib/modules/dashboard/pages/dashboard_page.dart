import 'package:flutter/material.dart';
import '../../../core/auth/sesion_store.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../tareas/api/tareas_api.dart';
import '../../tareas/models/tarea_model.dart';
import '../../tareas/widgets/tarea_card.dart';
import '../../tareas/widgets/tarea_detalle_sheet.dart';
import '../../tareas/widgets/tarea_form_dialog.dart';

/// Portada `/dashboard` («Pendientes»): tareas abiertas ordenadas por vencimiento (RN-43).
class DashboardPage extends StatefulWidget {
  const DashboardPage({
    super.key,
    required this.sesionStore,
    required this.tareasApi,
    this.cargarAlIniciar = true,
  });

  final SesionStore sesionStore;
  final TareasApi tareasApi;
  final bool cargarAlIniciar;

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  List<TareaDto> _pendientes = const <TareaDto>[];
  int _totalElementos = 0;
  bool _isCargando = false;
  String? _mensajeError;

  @override
  void initState() {
    super.initState();
    if (widget.cargarAlIniciar) {
      _cargarPendientes();
    }
  }

  Future<void> _cargarPendientes() async {
    setState(() {
      _isCargando = true;
      _mensajeError = null;
    });

    try {
      final pagina = await widget.tareasApi.obtenerPendientes();
      if (mounted) {
        setState(() {
          _pendientes = pagina.datos;
          _totalElementos = pagina.totalElementos;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _mensajeError = 'No se pudieron cargar las tareas pendientes.';
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
    await _cargarPendientes();
  }

  Future<void> _alternarCompletada(TareaDto tarea) async {
    await widget.tareasApi.alternarCompletada(tarea);
    await _cargarPendientes();
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
          await _cargarPendientes();
        },
        onEliminar: () async {
          Navigator.of(sheetContext).pop();
          await widget.tareasApi.eliminar(tarea.id);
          await _cargarPendientes();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final nombre = widget.sesionStore.usuario?.nombre;
    final puedeCrear = widget.sesionStore.puede('tareas:crear');
    final puedeActualizar = widget.sesionStore.puede('tareas:actualizar');

    final saludo = nombre != null && nombre.isNotEmpty
        ? 'Hola, $nombre.'
        : 'Hola.';
    final conteo = _totalElementos > 0
        ? ' Tienes $_totalElementos ${_totalElementos == 1 ? 'tarea abierta' : 'tareas abiertas'}.'
        : ' Tus tareas abiertas ordenadas por vencimiento.';

    return RefreshIndicator(
      onRefresh: _cargarPendientes,
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
                  Text('Pendientes', style: textTheme.headlineSmall),
                  const SizedBox(height: 4),
                  Text(
                    '$saludo$conteo',
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
                      onPressed: _cargarPendientes,
                      child: const Text('Reintentar'),
                    ),
                  ],
                ),
              ),
            )
          else if (_pendientes.isEmpty)
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
                    Text('Nada pendiente', style: textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text(
                      'Crea una tarea y aparecerá aquí, ordenada por vencimiento.',
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
            for (final tarea in _pendientes) ...<Widget>[
              TareaCard(
                tarea: tarea,
                mostrarEstado: false,
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
