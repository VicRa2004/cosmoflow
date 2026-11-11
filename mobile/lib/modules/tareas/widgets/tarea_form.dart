import 'package:flutter/material.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/campo_fecha.dart';
import '../../../core/widgets/editor_markdown.dart';
import '../../tags/models/tag_model.dart';
import '../models/tarea_model.dart';

/// Miembro elegible como responsable de una tarea compartida.
typedef ResponsableCandidato = ({int id, String nombre});

/// Valores del formulario de tarea (crear o editar).
class TareaFormValores {
  const TareaFormValores({
    required this.titulo,
    required this.contenido,
    required this.estado,
    required this.prioridad,
    this.fechaInicio,
    this.fechaVencimiento,
    this.tagIds = const <int>[],
    this.responsableIds = const <int>[],
  });

  final String titulo;
  final String contenido;
  final EstadoTarea estado;
  final PrioridadTarea prioridad;
  final String? fechaInicio;
  final String? fechaVencimiento;
  final List<int> tagIds;
  final List<int> responsableIds;
}

/// Campos de la tarea. No sabe dónde vive: la página llama a [TareaFormState.validar].
class TareaForm extends StatefulWidget {
  const TareaForm({
    super.key,
    this.tareaInicial,
    this.tagsDisponibles = const <TagDto>[],
    this.responsablesDisponibles = const <ResponsableCandidato>[],
    this.onCambio,
  });

  final TareaDto? tareaInicial;
  final List<TagDto> tagsDisponibles;
  final List<ResponsableCandidato> responsablesDisponibles;
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
  late final Set<int> _tags;
  late final Set<int> _responsables;

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
    _tags = Set<int>.from(t?.tagIds ?? const <int>[]);
    _responsables = Set<int>.from(t?.responsableIds ?? const <int>[]);
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
      tagIds: _tags.toList(growable: false),
      responsableIds: _responsables.toList(growable: false),
    );
  }

  @override
  Widget build(BuildContext context) {
    final seccion = Theme.of(context).textTheme.labelLarge
        ?.copyWith(color: context.colores.tintaTenue);
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
            hint: 'Detalles, pasos… o pulsa «/» para insertar un bloque',
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
          if (widget.responsablesDisponibles.isNotEmpty) ...<Widget>[
            const SizedBox(height: 24),
            Text('Responsables', style: seccion),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: <Widget>[
                for (final m in widget.responsablesDisponibles)
                  FilterChip(
                    avatar: const Icon(Icons.person_outline_rounded, size: 18),
                    label: Text(m.nombre),
                    selected: _responsables.contains(m.id),
                    onSelected: (sel) {
                      setState(
                        () => sel
                            ? _responsables.add(m.id)
                            : _responsables.remove(m.id),
                      );
                      widget.onCambio?.call();
                    },
                  ),
              ],
            ),
          ],
          if (widget.tagsDisponibles.isNotEmpty) ...<Widget>[
            const SizedBox(height: 24),
            Text('Tags', style: seccion),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: <Widget>[
                for (final tag in widget.tagsDisponibles)
                  FilterChip(
                    label: Text(tag.nombre),
                    selected: _tags.contains(tag.id),
                    onSelected: (sel) {
                      setState(
                        () => sel ? _tags.add(tag.id) : _tags.remove(tag.id),
                      );
                      widget.onCambio?.call();
                    },
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
