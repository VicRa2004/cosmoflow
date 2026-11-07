import 'package:flutter/material.dart';
import '../models/tarea_model.dart';

/// Resultado devuelto por el formulario de crear o editar tarea.
class TareaFormValores {
  const TareaFormValores({
    required this.titulo,
    required this.contenido,
    required this.estado,
    required this.prioridad,
    this.fechaInicio,
    this.fechaVencimiento,
  });

  final String titulo;
  final String contenido;
  final EstadoTarea estado;
  final PrioridadTarea prioridad;
  final String? fechaInicio;
  final String? fechaVencimiento;
}

/// Diálogo modal para crear o editar una tarea personal.
class TareaFormDialog extends StatefulWidget {
  const TareaFormDialog({super.key, this.tareaInicial});

  final TareaDto? tareaInicial;

  @override
  State<TareaFormDialog> createState() => _TareaFormDialogState();
}

class _TareaFormDialogState extends State<TareaFormDialog> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  late final TextEditingController _tituloController;
  late final TextEditingController _contenidoController;
  late final TextEditingController _inicioController;
  late final TextEditingController _vencimientoController;

  late EstadoTarea _estado;
  late PrioridadTarea _prioridad;

  static String _diaDesdeHoy(int dias) {
    final fecha = DateTime.now().add(Duration(days: dias));
    final m = fecha.month.toString().padLeft(2, '0');
    final d = fecha.day.toString().padLeft(2, '0');
    return '${fecha.year}-$m-$d';
  }

  @override
  void initState() {
    super.initState();
    final inicial = widget.tareaInicial;
    _tituloController = TextEditingController(text: inicial?.titulo ?? '');
    _contenidoController =
        TextEditingController(text: inicial?.contenido ?? '');
    _inicioController = TextEditingController(
      text: inicial != null ? (inicial.fechaInicio ?? '') : _diaDesdeHoy(0),
    );
    _vencimientoController = TextEditingController(
      text:
          inicial != null ? (inicial.fechaVencimiento ?? '') : _diaDesdeHoy(4),
    );
    _estado = inicial?.estado ?? EstadoTarea.pendiente;
    _prioridad = inicial?.prioridad ?? PrioridadTarea.media;
  }

  @override
  void dispose() {
    _tituloController.dispose();
    _contenidoController.dispose();
    _inicioController.dispose();
    _vencimientoController.dispose();
    super.dispose();
  }

  void _guardar() {
    final form = _formKey.currentState;
    if (form == null || !form.validate()) return;

    Navigator.of(context).pop(
      TareaFormValores(
        titulo: _tituloController.text.trim(),
        contenido: _contenidoController.text,
        estado: _estado,
        prioridad: _prioridad,
        fechaInicio: _inicioController.text.trim(),
        fechaVencimiento: _vencimientoController.text.trim(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final esEdicion = widget.tareaInicial != null;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 440),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: <Widget>[
                Text(
                  esEdicion ? 'Editar tarea' : 'Nueva tarea',
                  style: textTheme.titleMedium,
                ),
                const SizedBox(height: 16),
                Text('Título', style: textTheme.labelMedium),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _tituloController,
                  decoration: const InputDecoration(
                    hintText: 'Ej. Preparar entrega semanal',
                  ),
                  validator: (valor) {
                    if (valor == null || valor.trim().isEmpty) {
                      return 'El título es obligatorio';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                Text('Descripción (Markdown)', style: textTheme.labelMedium),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _contenidoController,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    hintText: 'Notas o detalles adicionales...',
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: <Widget>[
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text('Estado', style: textTheme.labelMedium),
                          const SizedBox(height: 6),
                          DropdownButtonFormField<EstadoTarea>(
                            initialValue: _estado,
                            items: EstadoTarea.values
                                .map(
                                  (e) => DropdownMenuItem<EstadoTarea>(
                                    value: e,
                                    child: Text(e.etiqueta),
                                  ),
                                )
                                .toList(growable: false),
                            onChanged: (valor) {
                              if (valor != null) {
                                setState(() => _estado = valor);
                              }
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text('Prioridad', style: textTheme.labelMedium),
                          const SizedBox(height: 6),
                          DropdownButtonFormField<PrioridadTarea>(
                            initialValue: _prioridad,
                            items: PrioridadTarea.values
                                .map(
                                  (p) => DropdownMenuItem<PrioridadTarea>(
                                    value: p,
                                    child: Text(p.etiqueta),
                                  ),
                                )
                                .toList(growable: false),
                            onChanged: (valor) {
                              if (valor != null) {
                                setState(() => _prioridad = valor);
                              }
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: <Widget>[
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text('Inicio (AAAA-MM-DD)',
                              style: textTheme.labelMedium),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: _inicioController,
                            decoration: const InputDecoration(
                              hintText: '2026-11-06',
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text('Vence (AAAA-MM-DD)',
                              style: textTheme.labelMedium),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: _vencimientoController,
                            decoration: const InputDecoration(
                              hintText: '2026-11-10',
                            ),
                            validator: (valor) {
                              final ini = _inicioController.text.trim();
                              final ven = valor?.trim() ?? '';
                              if (ini.isNotEmpty &&
                                  ven.isNotEmpty &&
                                  ven.compareTo(ini) < 0) {
                                return 'Posterior al inicio';
                              }
                              return null;
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Wrap(
                  alignment: WrapAlignment.end,
                  spacing: 8,
                  children: <Widget>[
                    OutlinedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Cancelar'),
                    ),
                    FilledButton(
                      onPressed: _guardar,
                      child: const Text('Guardar'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
