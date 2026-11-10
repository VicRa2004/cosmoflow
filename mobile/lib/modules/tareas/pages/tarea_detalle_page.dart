import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/contenido_markdown.dart';
import '../../../core/widgets/estados.dart';
import '../acciones_tarea.dart';
import '../models/tarea_model.dart';

/// `/tareas/:id`: lectura a pantalla completa. Pinta al instante con la tarea
/// recibida y la refresca por id; editar en la AppBar, eliminar en el menú.
class TareaDetallePage extends StatefulWidget {
  const TareaDetallePage({
    super.key,
    required this.id,
    required this.acciones,
    this.tarea,
  });

  final int id;
  final AccionesTarea acciones;
  final TareaDto? tarea;

  @override
  State<TareaDetallePage> createState() => _TareaDetallePageState();
}

class _TareaDetallePageState extends State<TareaDetallePage> {
  late TareaDto? _tarea = widget.tarea;
  String? _mensajeError;

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  Future<void> _cargar() async {
    try {
      final tarea = await widget.acciones.tareasApi.obtenerUno(widget.id);
      if (mounted) setState(() => _tarea = tarea);
    } catch (_) {
      if (mounted && _tarea == null) {
        setState(() => _mensajeError = 'No se pudo cargar la tarea.');
      }
    }
  }

  Future<void> _tras(Future<bool> cambio) async {
    if (await cambio) await _cargar();
  }

  Future<void> _eliminar(TareaDto tarea) async {
    if (await widget.acciones.eliminar(context, tarea) && mounted) {
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final tarea = _tarea;
    final store = widget.acciones.sesionStore;
    return Scaffold(
      appBar: AppBar(
        actions: <Widget>[
          if (tarea != null && store.puede('tareas:actualizar'))
            IconButton(
              tooltip: 'Editar',
              icon: const Icon(Icons.edit_outlined),
              onPressed: () => _tras(widget.acciones.editar(context, tarea)),
            ),
          if (tarea != null && store.puede('tareas:eliminar'))
            PopupMenuButton<void>(
              itemBuilder: (_) => <PopupMenuEntry<void>>[
                PopupMenuItem<void>(
                  onTap: () => _eliminar(tarea),
                  child: const Text('Eliminar'),
                ),
              ],
            ),
        ],
      ),
      body: tarea == null
          ? (_mensajeError == null
                ? const EstadoCargando()
                : EstadoError(mensaje: _mensajeError!, onReintentar: _cargar))
          : RefreshIndicator(onRefresh: _cargar, child: _contenido(tarea)),
    );
  }

  Widget _contenido(TareaDto tarea) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final completada = tarea.estado == EstadoTarea.completada;
    final puedeMarcar =
        widget.acciones.sesionStore.puede('tareas:actualizar') &&
        tarea.estado != EstadoTarea.cancelada;

    return ListView(
      padding: const EdgeInsets.only(bottom: 48),
      children: <Widget>[
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
          child: Text(
            tarea.titulo,
            style: textTheme.headlineSmall?.copyWith(
              decoration: completada ? TextDecoration.lineThrough : null,
              color: completada ? colores.tintaTenue : null,
            ),
          ),
        ),
        if (puedeMarcar)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: FilledButton.tonalIcon(
              onPressed: () =>
                  _tras(widget.acciones.alternarCompletada(context, tarea)),
              icon: Icon(
                completada ? Icons.replay_rounded : Icons.check_rounded,
              ),
              label: Text(completada ? 'Reabrir' : 'Marcar como completada'),
            ),
          ),
        _Dato(
          icono: Icons.flag_outlined,
          etiqueta: 'Estado',
          valor: tarea.estado.etiqueta,
        ),
        _Dato(
          icono: Icons.priority_high_rounded,
          etiqueta: 'Prioridad',
          valor: tarea.prioridad.etiqueta,
        ),
        _Dato(
          icono: Icons.event_outlined,
          etiqueta: 'Fechas',
          valor:
              '${tarea.fechaInicio ?? 'Sin inicio'} → ${tarea.fechaVencimiento ?? 'Sin vencimiento'}',
        ),
        if (tarea.isCompartida)
          const _Dato(
            icono: Icons.group_outlined,
            etiqueta: 'Ámbito',
            valor: 'Compartida',
          ),
        const Divider(height: 32),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: ContenidoMarkdown(texto: tarea.contenido),
        ),
      ],
    );
  }
}

class _Dato extends StatelessWidget {
  const _Dato({
    required this.icono,
    required this.etiqueta,
    required this.valor,
  });

  final IconData icono;
  final String etiqueta;
  final String valor;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      dense: true,
      leading: Icon(icono),
      title: Text(etiqueta, style: Theme.of(context).textTheme.bodySmall),
      subtitle: Text(valor, style: Theme.of(context).textTheme.bodyLarge),
    );
  }
}
