import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/auth/sesion_store.dart';
import '../../../core/offline/aviso_pendientes.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/estados.dart';
import '../../../core/widgets/tarjeta_seccion.dart';
import '../../notificaciones/api/notificaciones_api.dart';
import '../../notificaciones/widgets/boton_notificaciones.dart';
import '../../organizaciones/api/organizaciones_api.dart';
import '../../organizaciones/services/contexto_organizacion_cache.dart';
import '../../tareas/acciones_tarea.dart';
import '../../tareas/api/tareas_api.dart';
import '../../tareas/models/tarea_model.dart';
import '../../tareas/widgets/selector_destino_tarea_sheet.dart';
import '../../tareas/widgets/tarea_fila.dart';

/// Portada `/dashboard` («Pendientes»): tareas abiertas agrupadas en tarjetas
/// por vencimiento (Vencidas, Hoy, Próximas y Sin fecha).
class DashboardPage extends StatefulWidget {
  const DashboardPage({
    super.key,
    required this.sesionStore,
    required this.tareasApi,
    this.organizacionesApi,
    this.notificacionesApi,
    this.cargarAlIniciar = true,
  });

  final SesionStore sesionStore;
  final TareasApi tareasApi;
  final OrganizacionesApi? organizacionesApi;
  final NotificacionesApi? notificacionesApi;
  final bool cargarAlIniciar;

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  late final _acciones = AccionesTarea(
    sesionStore: widget.sesionStore,
    tareasApi: widget.tareasApi,
  );
  late final ContextoOrganizacionCache? _contextoCache =
      widget.organizacionesApi == null
      ? null
      : ContextoOrganizacionCache(organizacionesApi: widget.organizacionesApi!);
  List<TareaDto> _pendientes = const <TareaDto>[];
  Map<int, UbicacionTarea> _ubicaciones = const <int, UbicacionTarea>{};
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
      final cache = _contextoCache;
      if (cache != null) {
        final mapa = await cache.resolverParaTareas(pagina.datos);
        if (mounted) setState(() => _ubicaciones = mapa);
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

  Future<void> _crearTarea() async {
    final orgApi = widget.organizacionesApi;
    if (orgApi == null) {
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

  Future<void> _recargarSi(Future<bool> cambio) async {
    if (await cambio) await _cargar();
  }

  List<_GrupoPendientes> _agruparPorVencimiento(ColoresNocheIndigo colores) {
    final ahora = DateTime.now();
    final hoy = DateTime(ahora.year, ahora.month, ahora.day);
    final vencidas = <TareaDto>[];
    final deHoy = <TareaDto>[];
    final proximas = <TareaDto>[];
    final sinFecha = <TareaDto>[];

    for (final tarea in _pendientes) {
      final raw = tarea.fechaVencimiento;
      final fecha = raw == null || raw.isEmpty ? null : DateTime.tryParse(raw);
      if (fecha == null) {
        sinFecha.add(tarea);
      } else {
        final dias = fecha.difference(hoy).inDays;
        if (dias < 0) {
          vencidas.add(tarea);
        } else if (dias == 0) {
          deHoy.add(tarea);
        } else {
          proximas.add(tarea);
        }
      }
    }

    return <_GrupoPendientes>[
      if (vencidas.isNotEmpty)
        _GrupoPendientes(
          titulo: 'Vencidas',
          color: colores.rosePeligro,
          tareas: vencidas,
        ),
      if (deHoy.isNotEmpty)
        _GrupoPendientes(
          titulo: 'Hoy',
          color: colores.amberAviso,
          tareas: deHoy,
        ),
      if (proximas.isNotEmpty)
        _GrupoPendientes(
          titulo: 'Próximas',
          color: colores.indigoMarca,
          tareas: proximas,
        ),
      if (sinFecha.isNotEmpty)
        _GrupoPendientes(
          titulo: 'Sin fecha',
          color: colores.tintaTenue,
          tareas: sinFecha,
        ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final nombre = widget.sesionStore.usuario?.nombre ?? '';
    final puedeActualizar = widget.sesionStore.puede('tareas:actualizar');
    final saludo = nombre.isEmpty ? 'Hola' : 'Hola, $nombre';
    final resumen = _total == 0
        ? '$saludo · Todo al día'
        : '$saludo · $_total ${_total == 1 ? 'pendiente' : 'pendientes'}';
    final grupos = _agruparPorVencimiento(colores);

    final puedeBuscar =
        widget.sesionStore.puede('tareas:leer') ||
        widget.sesionStore.puede('notas:leer') ||
        widget.sesionStore.puede('organizaciones:leer');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pendientes'),
        actions: <Widget>[
          if (puedeBuscar)
            IconButton(
              tooltip: 'Buscar',
              icon: const Icon(LucideIcons.search),
              onPressed: () => context.push('/buscar'),
            ),
          if (widget.notificacionesApi != null)
            BotonNotificaciones(
              notificacionesApi: widget.notificacionesApi!,
              cargarAlIniciar: widget.cargarAlIniciar,
            ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(24),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                resumen,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: colores.tintaTenue,
                ),
              ),
            ),
          ),
        ),
      ),
      floatingActionButton: widget.sesionStore.puede('tareas:crear')
          ? FloatingActionButton.extended(
              onPressed: _crearTarea,
              icon: const Icon(LucideIcons.plus, size: 20),
              label: const Text('Nueva tarea'),
            )
          : null,
      body: RefreshIndicator(
        onRefresh: _cargar,
        child: ListView(
          padding: const EdgeInsets.only(top: 8, bottom: 104),
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
                icono: LucideIcons.circleCheck,
                titulo: 'Nada pendiente',
                mensaje:
                    'Crea una tarea y aparecerá aquí, ordenada por vencimiento.',
              )
            else
              for (final grupo in grupos) ...<Widget>[
                TarjetaSeccion(
                  titulo: grupo.titulo,
                  contador: grupo.tareas.length,
                  colorTitulo: grupo.color,
                  divisorIndent: 56,
                  children: <Widget>[
                    for (final tarea in grupo.tareas)
                      TareaFila(
                        tarea: tarea,
                        ubicacion: _ubicaciones[tarea.id],
                        mostrarEstado: false,
                        puedeActualizar: puedeActualizar,
                        onTap: () => _recargarSi(
                          _acciones.abrirDetalle(
                            context,
                            tarea,
                            ubicacion: _ubicaciones[tarea.id],
                          ),
                        ),
                        onAlternarCompletada: () => _recargarSi(
                          _acciones.alternarCompletada(context, tarea),
                        ),
                        onAlternarFijada: () => _recargarSi(
                          _acciones.alternarFijada(context, tarea),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 20),
              ],
          ],
        ),
      ),
    );
  }
}

class _GrupoPendientes {
  const _GrupoPendientes({
    required this.titulo,
    required this.color,
    required this.tareas,
  });

  final String titulo;
  final Color color;
  final List<TareaDto> tareas;
}
