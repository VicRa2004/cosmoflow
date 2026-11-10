import 'package:flutter/material.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/campo_fecha.dart';
import '../../../core/widgets/editor_markdown.dart';
import '../models/tarea_model.dart';

/// Valores del formulario de tarea (crear o editar).
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

/// Campos de la tarea. No sabe dónde vive: la página llama a [TareaFormState.validar].
class TareaForm extends StatefulWidget {
  const TareaForm({super.key, this.tareaInicial, this.onCambio});

  final TareaDto? tareaInicial;
  final VoidCallback? onCambio;

  @override
  State<TareaForm> createState() => TareaFormState();
}

class TareaFormState extends State<TareaForm> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _titulo;
  late final TextEditingController _contenido;
  late final TextEditingController _inicio;
  late final TextEditingController _vencimiento;
  late EstadoTarea _estado;
  late PrioridadTarea _prioridad;

  @override
  void initState() {
    super.initState();
    final t = widget.tareaInicial;
    final hoy = DateTime.now();
    _titulo = TextEditingController(text: t?.titulo ?? '');
    _contenido = TextEditingController(text: t?.contenido ?? '');
    _inicio = TextEditingController(
      text: t != null ? (t.fechaInicio ?? '') : CampoFecha.aIso(hoy),
    );
    _vencimiento = TextEditingController(
      text: t != null
          ? (t.fechaVencimiento ?? '')
          : CampoFecha.aIso(hoy.add(const Duration(days: 4))),
    );
    _estado = t?.estado ?? EstadoTarea.pendiente;
    _prioridad = t?.prioridad ?? PrioridadTarea.media;
    for (final c in <TextEditingController>[_inicio, _vencimiento]) {
      c.addListener(() => widget.onCambio?.call());
    }
  }

  @override
  void dispose() {
    for (final c in <TextEditingController>[
      _titulo,
      _contenido,
      _inicio,
      _vencimiento,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  /// Valida y devuelve los valores, o `null` si hay errores.
  TareaFormValores? validar() {
    if (!(_formKey.currentState?.validate() ?? false)) return null;
    String? fecha(TextEditingController c) =>
        c.text.trim().isEmpty ? null : c.text.trim();
    return TareaFormValores(
      titulo: _titulo.text.trim(),
      contenido: _contenido.text,
      estado: _estado,
      prioridad: _prioridad,
      fechaInicio: fecha(_inicio),
      fechaVencimiento: fecha(_vencimiento),
    );
  }

  @override
  Widget build(BuildContext context) {
    final seccion = Theme.of(
      context,
    ).textTheme.labelLarge?.copyWith(color: context.colores.tintaTenue);
    return Form(
      key: _formKey,
      onChanged: widget.onCambio,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: <Widget>[
          TextFormField(
            controller: _titulo,
            autofocus: widget.tareaInicial == null,
            textCapitalization: TextCapitalization.sentences,
            textInputAction: TextInputAction.next,
            decoration: const InputDecoration(labelText: 'Título'),
            validator: (v) => (v == null || v.trim().isEmpty)
                ? 'El título es obligatorio'
                : null,
          ),
          const SizedBox(height: 24),
          Text('Descripción', style: seccion),
          const SizedBox(height: 8),
          EditorMarkdown(
            controller: _contenido,
            hint: 'Toca para añadir detalles, pasos… (admite Markdown)',
            onCambio: widget.onCambio,
          ),
          const SizedBox(height: 24),
          Text('Prioridad', style: seccion),
          const SizedBox(height: 8),
          SegmentedButton<PrioridadTarea>(
            showSelectedIcon: false,
            segments: <ButtonSegment<PrioridadTarea>>[
              for (final p in PrioridadTarea.values)
                ButtonSegment<PrioridadTarea>(
                  value: p,
                  label: Text(p.etiqueta),
                ),
            ],
            selected: <PrioridadTarea>{_prioridad},
            onSelectionChanged: (s) {
              setState(() => _prioridad = s.first);
              widget.onCambio?.call();
            },
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<EstadoTarea>(
            initialValue: _estado,
            decoration: const InputDecoration(labelText: 'Estado'),
            items: <DropdownMenuItem<EstadoTarea>>[
              for (final e in EstadoTarea.values)
                DropdownMenuItem<EstadoTarea>(
                  value: e,
                  child: Text(e.etiqueta),
                ),
            ],
            onChanged: (v) {
              if (v != null) setState(() => _estado = v);
            },
          ),
          const SizedBox(height: 24),
          Text('Fechas', style: seccion),
          const SizedBox(height: 8),
          CampoFecha(etiqueta: 'Inicio', controller: _inicio),
          const SizedBox(height: 16),
          CampoFecha(
            etiqueta: 'Vence',
            controller: _vencimiento,
            validator: (v) {
              final ini = _inicio.text.trim();
              final ven = v?.trim() ?? '';
              return ini.isNotEmpty && ven.isNotEmpty && ven.compareTo(ini) < 0
                  ? 'Debe ser posterior al inicio'
                  : null;
            },
          ),
        ],
      ),
    );
  }
}
