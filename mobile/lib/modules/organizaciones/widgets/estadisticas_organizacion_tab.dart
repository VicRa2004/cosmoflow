import 'package:flutter/material.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/estados.dart';
import '../../tareas/api/tareas_api.dart';
import '../../tareas/models/estadisticas_tareas_model.dart';
import '../models/organizacion_models.dart';
import 'estadisticas_tareas_card.dart';

/// Pestaña de estadísticas para una organización o un equipo.
class EstadisticasDestinoTab extends StatefulWidget {
  const EstadisticasDestinoTab({
    super.key,
    required this.tareasApi,
    required this.miembros,
    this.organizacionId,
    this.equipoId,
    this.totalEquipos,
    this.totalProyectos,
    this.tituloTareas = 'Tareas de la organización',
    this.onRefreshExtra,
    this.cargarAlIniciar = true,
  });

  final TareasApi tareasApi;
  final List<MiembroDto> miembros;
  final int? organizacionId;
  final int? equipoId;
  final int? totalEquipos;
  final int? totalProyectos;
  final String tituloTareas;
  final Future<void> Function()? onRefreshExtra;
  final bool cargarAlIniciar;

  @override
  State<EstadisticasDestinoTab> createState() => _EstadisticasDestinoTabState();
}

class _EstadisticasDestinoTabState extends State<EstadisticasDestinoTab> {
  EstadisticasTareasDto? _estadisticas;
  bool _cargando = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (widget.cargarAlIniciar) _cargar();
  }

  Future<void> _cargar() async {
    setState(() {
      _cargando = true;
      _error = null;
    });
    try {
      final datos = await widget.tareasApi.obtenerEstadisticas(
        organizacionId: widget.organizacionId,
        equipoId: widget.equipoId,
      );
      if (mounted) setState(() => _estadisticas = datos);
    } catch (_) {
      if (mounted) {
        setState(() => _error = 'No se pudieron cargar las estadísticas.');
      }
    } finally {
      if (mounted) setState(() => _cargando = false);
    }
  }

  Future<void> _refrescar() async {
    await Future.wait<void>(<Future<void>>[
      _cargar(),
      if (widget.onRefreshExtra != null) widget.onRefreshExtra!(),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final nombres = <int, String>{
      for (final m in widget.miembros) m.usuarioId: m.nombre,
    };
    final esOrganizacion =
        widget.totalEquipos != null && widget.totalProyectos != null;

    return RefreshIndicator(
      onRefresh: _refrescar,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 48),
        children: <Widget>[
          if (esOrganizacion) ...<Widget>[
            Row(
              children: <Widget>[
                Expanded(
                  child: _ResumenCard(
                    valor: widget.miembros.length,
                    etiqueta: 'Miembros',
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _ResumenCard(
                    valor: widget.totalEquipos!,
                    etiqueta: 'Equipos',
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _ResumenCard(
                    valor: widget.totalProyectos!,
                    etiqueta: 'Proyectos',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],
          if (_cargando && _estadisticas == null)
            const EstadoCargando()
          else if (_error != null && _estadisticas == null)
            EstadoError(mensaje: _error!, onReintentar: _cargar)
          else if (_estadisticas != null)
            EstadisticasTareasCard(
              estadisticas: _estadisticas!,
              nombres: nombres,
              titulo: widget.tituloTareas,
            )
          else
            const EstadoVacio(
              icono: Icons.bar_chart_rounded,
              titulo: 'Sin estadísticas',
              mensaje: 'Desliza hacia abajo para actualizar los datos.',
            ),
        ],
      ),
    );
  }
}

class _ResumenCard extends StatelessWidget {
  const _ResumenCard({required this.valor, required this.etiqueta});

  final int valor;
  final String etiqueta;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              '$valor',
              style: textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              etiqueta,
              style: textTheme.bodySmall?.copyWith(color: colores.tintaTenue),
            ),
          ],
        ),
      ),
    );
  }
}
