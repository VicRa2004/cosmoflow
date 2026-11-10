import 'package:flutter/material.dart';
import '../../../core/auth/sesion_store.dart';
import '../../../core/offline/aviso_pendientes.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/estados.dart';
import '../../tareas/acciones_tarea.dart';
import '../../tareas/api/tareas_api.dart';
import '../../tareas/models/tarea_model.dart';
import '../../tareas/widgets/tarea_fila.dart';

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
  late final _acciones = AccionesTarea(
    sesionStore: widget.sesionStore,
    tareasApi: widget.tareasApi,
  );
  List<TareaDto> _pendientes = const <TareaDto>[];
  int _total = 0;
  bool _isCargando = false;
  String? _mensajeError;

  @override
  void initState() {
    super.initState();
    if (widget.cargarAlIniciar) _cargar();
  }

  Future<void> _cargar() async {
    setState(() {
      _isCargando = _pendientes.isEmpty;
      _mensajeError = null;
    });
    try {
      final pagina = await widget.tareasApi.obtenerPendientes();
      if (mounted) {
        setState(() {
          _pendientes = pagina.datos;
          _total = pagina.totalElementos;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(
          () => _mensajeError = 'No se pudieron cargar las tareas pendientes.',
        );
      }
    } finally {
      if (mounted) setState(() => _isCargando = false);
    }
  }

  Future<void> _recargarSi(Future<bool> cambio) async {
    if (await cambio) await _cargar();
  }

  @override
  Widget build(BuildContext context) {
    final nombre = widget.sesionStore.usuario?.nombre ?? '';
    final puedeActualizar = widget.sesionStore.puede('tareas:actualizar');
    final resumen = _total == 0
        ? 'Hola${nombre.isEmpty ? '' : ', $nombre'}'
        : 'Hola${nombre.isEmpty ? '' : ', $nombre'} · $_total ${_total == 1 ? 'abierta' : 'abiertas'}';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pendientes'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(20),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                resumen,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: context.colores.tintaTenue,
                ),
              ),
            ),
          ),
        ),
      ),
      floatingActionButton: widget.sesionStore.puede('tareas:crear')
          ? FloatingActionButton.extended(
              onPressed: () => _recargarSi(_acciones.crear(context)),
              icon: const Icon(Icons.add_rounded),
              label: const Text('Nueva tarea'),
            )
          : null,
      body: RefreshIndicator(
        onRefresh: _cargar,
        child: ListView(
          padding: const EdgeInsets.only(bottom: 96),
          children: <Widget>[
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
            else if (_pendientes.isEmpty)
              const EstadoVacio(
                icono: Icons.task_alt_rounded,
                titulo: 'Nada pendiente',
                mensaje:
                    'Crea una tarea y aparecerá aquí, ordenada por vencimiento.',
              )
            else
              for (final tarea in _pendientes) ...<Widget>[
                TareaFila(
                  tarea: tarea,
                  mostrarEstado: false,
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
