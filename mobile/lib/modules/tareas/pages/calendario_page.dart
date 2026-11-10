import 'package:flutter/material.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/estados.dart';
import '../acciones_tarea.dart';
import '../api/tareas_api.dart';
import '../models/tarea_model.dart';
import '../widgets/tarea_fila.dart';

const _diasSemana = <String>['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const _meses = <String>[
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

/// AAAA-MM-DD de una fecha local.
String diaLocal(DateTime f) =>
    '${f.year.toString().padLeft(4, '0')}-${f.month.toString().padLeft(2, '0')}-${f.day.toString().padLeft(2, '0')}';

/// Días de la cuadrícula de un mes: semanas completas de lunes a domingo.
List<DateTime> diasDelMes(int anio, int mes) {
  final antes = DateTime(anio, mes).weekday - 1;
  final diasMes = DateTime(anio, mes + 1, 0).day;
  final total = ((antes + diasMes) / 7).ceil() * 7;
  return List<DateTime>.generate(
    total,
    (i) => DateTime(anio, mes, 1 - antes + i),
  );
}

/// Mes con las tareas abiertas (sin completadas ni canceladas), como en la web.
class CalendarioPage extends StatefulWidget {
  const CalendarioPage({
    super.key,
    required this.tareasApi,
    required this.acciones,
  });

  final TareasApi tareasApi;
  final AccionesTarea acciones;

  @override
  State<CalendarioPage> createState() => _CalendarioPageState();
}

class _CalendarioPageState extends State<CalendarioPage> {
  late DateTime _mes;
  late String _seleccionado;
  Map<String, List<TareaDto>> _porDia = const {};
  bool _isCargando = false;
  String? _mensajeError;

  @override
  void initState() {
    super.initState();
    final hoy = DateTime.now();
    _mes = DateTime(hoy.year, hoy.month);
    _seleccionado = diaLocal(hoy);
    _cargar();
  }

  Future<void> _cargar() async {
    final dias = diasDelMes(_mes.year, _mes.month);
    setState(() {
      _isCargando = true;
      _mensajeError = null;
    });
    try {
      final tareas = await widget.tareasApi.calendario(
        diaLocal(dias.first),
        diaLocal(dias.last),
      );
      final porDia = <String, List<TareaDto>>{};
      for (final t in tareas) {
        // Cada tarea va en su vencimiento o, sin él, en su inicio (como en la API).
        final dia = t.fechaVencimiento ?? t.fechaInicio;
        if (dia == null || !t.estado.isAbierta) continue;
        (porDia[dia] ??= <TareaDto>[]).add(t);
      }
      if (mounted) setState(() => _porDia = porDia);
    } catch (_) {
      if (mounted) {
        setState(() => _mensajeError = 'No se pudo cargar el calendario.');
      }
    } finally {
      if (mounted) setState(() => _isCargando = false);
    }
  }

  void _mover(int meses) {
    setState(() => _mes = DateTime(_mes.year, _mes.month + meses));
    _cargar();
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final hoy = diaLocal(DateTime.now());
    final tareasDia = _porDia[_seleccionado] ?? const <TareaDto>[];

    return Scaffold(
      appBar: AppBar(
        title: Text('${_meses[_mes.month - 1]} ${_mes.year}'),
        actions: <Widget>[
          IconButton(
            tooltip: 'Mes anterior',
            icon: const Icon(Icons.chevron_left_rounded),
            onPressed: () => _mover(-1),
          ),
          IconButton(
            tooltip: 'Mes siguiente',
            icon: const Icon(Icons.chevron_right_rounded),
            onPressed: () => _mover(1),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _cargar,
        child: ListView(
          children: <Widget>[
            if (_isCargando) const LinearProgressIndicator(),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: GridView.count(
                crossAxisCount: 7,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                children: <Widget>[
                  for (final d in _diasSemana)
                    Center(
                      child: Text(
                        d,
                        style: TextStyle(color: colores.tintaTenue),
                      ),
                    ),
                  for (final fecha in diasDelMes(_mes.year, _mes.month))
                    _Dia(
                      fecha: fecha,
                      delMes: fecha.month == _mes.month,
                      esHoy: diaLocal(fecha) == hoy,
                      seleccionado: diaLocal(fecha) == _seleccionado,
                      tareas: _porDia[diaLocal(fecha)]?.length ?? 0,
                      vencidas: diaLocal(fecha).compareTo(hoy) < 0,
                      onTap: () =>
                          setState(() => _seleccionado = diaLocal(fecha)),
                    ),
                ],
              ),
            ),
            const Divider(),
            if (_mensajeError != null)
              EstadoError(mensaje: _mensajeError!, onReintentar: _cargar)
            else if (tareasDia.isEmpty)
              const EstadoVacio(
                icono: Icons.event_available_outlined,
                titulo: 'Día libre',
                mensaje: 'No hay tareas abiertas para este día.',
              )
            else
              for (final t in tareasDia)
                TareaFila(
                  tarea: t,
                  mostrarEstado: false,
                  onTap: () async {
                    await widget.acciones.abrirDetalle(context, t);
                    _cargar();
                  },
                ),
          ],
        ),
      ),
    );
  }
}

class _Dia extends StatelessWidget {
  const _Dia({
    required this.fecha,
    required this.delMes,
    required this.esHoy,
    required this.seleccionado,
    required this.tareas,
    required this.vencidas,
    required this.onTap,
  });

  final DateTime fecha;
  final bool delMes;
  final bool esHoy;
  final bool seleccionado;
  final int tareas;
  final bool vencidas;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final scheme = Theme.of(context).colorScheme;
    return InkWell(
      onTap: onTap,
      customBorder: const CircleBorder(),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: <Widget>[
          Container(
            width: 32,
            height: 32,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: esHoy ? scheme.primary : null,
              border: seleccionado && !esHoy
                  ? Border.all(color: scheme.primary)
                  : null,
            ),
            child: Text(
              '${fecha.day}',
              style: TextStyle(
                color: esHoy
                    ? scheme.onPrimary
                    : delMes
                    ? colores.tinta
                    : colores.tintaTenue,
              ),
            ),
          ),
          const SizedBox(height: 2),
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: tareas == 0
                  ? Colors.transparent
                  : vencidas
                  ? colores.rosePeligro
                  : scheme.primary,
            ),
          ),
        ],
      ),
    );
  }
}
