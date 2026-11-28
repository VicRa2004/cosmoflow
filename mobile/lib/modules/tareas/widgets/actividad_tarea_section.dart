import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../api/tareas_api.dart';
import '../models/actividad_tarea_model.dart';

/// Historial de actividad desplegable dentro del detalle de una tarea.
class ActividadTareaSection extends StatefulWidget {
  const ActividadTareaSection({
    super.key,
    required this.tareaId,
    required this.tareasApi,
  });

  final int tareaId;
  final TareasApi tareasApi;

  @override
  State<ActividadTareaSection> createState() => _ActividadTareaSectionState();
}

class _ActividadTareaSectionState extends State<ActividadTareaSection> {
  bool _abierto = false;
  bool _cargando = false;
  bool _hayMas = false;
  String? _error;
  List<EntradaActividadDto> _entradas = const <EntradaActividadDto>[];
  Map<int, String> _nombres = const <int, String>{};

  Future<void> _cargar({bool mas = false}) async {
    if (_cargando) return;
    setState(() {
      _cargando = true;
      _error = null;
    });
    try {
      final pagina = await widget.tareasApi.obtenerActividad(
        widget.tareaId,
        antesDe: mas && _entradas.isNotEmpty ? _entradas.last.id : null,
      );
      if (!mounted) return;
      setState(() {
        _entradas = mas
            ? <EntradaActividadDto>[..._entradas, ...pagina.datos]
            : pagina.datos;
        _nombres = <int, String>{..._nombres, ...pagina.nombres};
        _hayMas = pagina.hayMas;
      });
    } catch (_) {
      if (mounted) {
        setState(() => _error = 'No se pudo cargar el historial.');
      }
    } finally {
      if (mounted) setState(() => _cargando = false);
    }
  }

  void _alternar() {
    setState(() => _abierto = !_abierto);
    if (_abierto && _entradas.isEmpty) _cargar();
  }

  String _formatoFecha(DateTime fecha) {
    final local = fecha.toLocal();
    final d = local.day.toString().padLeft(2, '0');
    final m = local.month.toString().padLeft(2, '0');
    final h = local.hour.toString().padLeft(2, '0');
    final min = local.minute.toString().padLeft(2, '0');
    return '$d/$m/${local.year} · $h:$min';
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        InkWell(
          onTap: _alternar,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: <Widget>[
                Icon(LucideIcons.history, size: 18, color: colores.tintaSuave),
                const SizedBox(width: 10),
                Expanded(child: Text('Actividad', style: textTheme.titleSmall)),
                Icon(
                  _abierto ? LucideIcons.chevronUp : LucideIcons.chevronDown,
                  size: 18,
                  color: colores.tintaTenue,
                ),
              ],
            ),
          ),
        ),
        if (_abierto) ...<Widget>[
          const Divider(height: 1),
          if (_cargando && _entradas.isEmpty)
            const Padding(
              padding: EdgeInsets.all(20),
              child: Center(
                child: SizedBox.square(
                  dimension: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
            )
          else if (_error != null && _entradas.isEmpty)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: <Widget>[
                  Expanded(
                    child: Text(
                      _error!,
                      style: textTheme.bodySmall?.copyWith(
                        color: colores.rosePeligro,
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: _cargar,
                    child: const Text('Reintentar'),
                  ),
                ],
              ),
            )
          else if (_entradas.isEmpty)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'Sin actividad registrada todavía.',
                style: textTheme.bodySmall,
              ),
            )
          else ...<Widget>[
            for (final e in _entradas)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Padding(
                      padding: const EdgeInsets.only(top: 5),
                      child: Container(
                        width: 7,
                        height: 7,
                        decoration: BoxDecoration(
                          color: colores.indigoMarca,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text(
                            describirActividad(e, _nombres),
                            style: textTheme.bodyMedium,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            _formatoFecha(e.ocurridoEn),
                            style: textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            if (_hayMas)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                child: TextButton(
                  onPressed: _cargando ? null : () => _cargar(mas: true),
                  child: const Text('Cargar más'),
                ),
              ),
          ],
        ],
      ],
    );
  }
}
