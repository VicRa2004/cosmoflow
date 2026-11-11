import 'package:flutter/material.dart';

import '../../../core/auth/sesion_store.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/estados.dart';
import '../../tags/api/tags_api.dart';
import '../../tags/models/tag_model.dart';
import '../../tareas/api/tareas_api.dart';
import '../../tareas/pages/tareas_page.dart';
import '../api/organizaciones_api.dart';
import '../models/organizacion_models.dart';

/// Argumentos para abrir `/organizaciones/:id/equipos/:equipoId`.
class EquipoDetalleArgs {
  const EquipoDetalleArgs({
    this.equipo,
    this.miembros = const <MiembroDto>[],
    this.tags = const <TagDto>[],
  });

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
  late EquipoDto? _equipo = widget.args.equipo;
  late List<MiembroDto> _miembros = widget.args.miembros;
  late List<TagDto> _tags = widget.args.tags;
  String? _mensajeError;

  @override
  void initState() {
    super.initState();
    if (widget.cargarAlIniciar && (_equipo == null || _miembros.isEmpty)) {
      _cargarContexto();
    }
  }

  Future<void> _cargarContexto() async {
    try {
      final res = await Future.wait<dynamic>(<Future<dynamic>>[
        widget.organizacionesApi.obtenerEquipos(widget.organizacionId),
        widget.organizacionesApi.obtenerMiembros(widget.organizacionId),
        widget.tagsApi.obtenerTodos(organizacionId: widget.organizacionId),
      ]);
      if (!mounted) return;
      final equipos = res[0] as List<EquipoDto>;
      setState(() {
        _equipo =
            equipos.where((e) => e.id == widget.equipoId).firstOrNull ??
            _equipo;
        _miembros = res[1] as List<MiembroDto>;
        _tags = (res[2] as PaginaTags).datos;
        _mensajeError = _equipo == null ? 'No se encontró el equipo.' : null;
      });
    } catch (_) {
      if (mounted && _equipo == null) {
        setState(() => _mensajeError = 'No se pudo cargar el equipo.');
      }
    }
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
          return (nombre: nombre, esLider: esLider);
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
                    label: Text(i.esLider ? '${i.nombre} · Líder' : i.nombre),
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

    final responsables = filtrarMiembrosDestino(
      miembros: _miembros,
      equipos: <EquipoDto>[equipo],
      equipoId: equipo.id,
    );
    final puedeCrear = equipo.puedeCrearTareas(widget.sesionStore.usuario?.id);

    return Scaffold(
      appBar: AppBar(title: Text(equipo.nombre)),
      body: TareasPage(
        sesionStore: widget.sesionStore,
        tareasApi: widget.tareasApi,
        equipoId: equipo.id,
        tags: _tags,
        responsables: responsables,
        puedeCrear: puedeCrear,
        mostrarAppBar: false,
        encabezadoExtra: _encabezado(context, equipo),
        cargarAlIniciar: widget.cargarAlIniciar,
      ),
    );
  }
}
