import 'package:flutter/material.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/editor_markdown.dart';
import '../../organizaciones/widgets/selector_color.dart';
import '../../tareas/models/tarea_model.dart';
import '../../tareas/widgets/campo_subtareas.dart';
import '../models/plantilla_model.dart';

/// Valores validados del formulario de edición de plantilla.
class PlantillaFormValores {
  const PlantillaFormValores({
    required this.nombre,
    required this.titulo,
    required this.contenido,
    required this.prioridad,
    this.color,
    this.subtareas = const <String>[],
  });

  final String nombre;
  final String titulo;
  final String contenido;
  final PrioridadTarea prioridad;
  final String? color;
  final List<String> subtareas;
}

/// Formulario para editar una plantilla existente (sin tags, RN-60).
class PlantillaForm extends StatefulWidget {
  const PlantillaForm({
    super.key,
    required this.plantillaInicial,
    this.onCambio,
  });

  final PlantillaTareaDto plantillaInicial;
  final VoidCallback? onCambio;

  @override
  State<PlantillaForm> createState() => PlantillaFormState();
}

class PlantillaFormState extends State<PlantillaForm> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nombre;
  late final TextEditingController _titulo;
  late final TextEditingController _contenido;
  late PrioridadTarea _prioridad;
  String? _color;
  late final List<String> _subtareas;

  @override
  void initState() {
    super.initState();
    final p = widget.plantillaInicial;
    _nombre = TextEditingController(text: p.nombre);
    _titulo = TextEditingController(text: p.titulo);
    _contenido = TextEditingController(text: p.contenido);
    _prioridad = p.prioridad;
    _color = p.color;
    _subtareas = List<String>.from(p.subtareas);
  }

  @override
  void dispose() {
    _nombre.dispose();
    _titulo.dispose();
    _contenido.dispose();
    super.dispose();
  }

  /// Valida y devuelve los valores normalizados, o `null` si hay errores.
  PlantillaFormValores? validar() {
    if (!(_formKey.currentState?.validate() ?? false)) return null;
    final colorLimpio = _color?.trim();
    return PlantillaFormValores(
      nombre: _nombre.text.trim(),
      titulo: _titulo.text.trim(),
      contenido: _contenido.text,
      prioridad: _prioridad,
      color: (colorLimpio != null && colorLimpio.isNotEmpty)
          ? colorLimpio
          : null,
      subtareas: normalizarSubtareasPlantilla(_subtareas),
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
            controller: _nombre,
            maxLength: 100,
            textCapitalization: TextCapitalization.sentences,
            textInputAction: TextInputAction.next,
            decoration: const InputDecoration(labelText: 'Nombre'),
            validator: (v) {
              final limpio = v?.trim() ?? '';
              if (limpio.isEmpty) return 'El nombre es obligatorio';
              if (limpio.length > 100) return 'Máximo 100 caracteres';
              return null;
            },
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _titulo,
            maxLength: 255,
            textCapitalization: TextCapitalization.sentences,
            textInputAction: TextInputAction.next,
            decoration: const InputDecoration(labelText: 'Título de la tarea'),
            validator: (v) {
              final limpio = v?.trim() ?? '';
              if (limpio.isEmpty) return 'El título es obligatorio';
              if (limpio.length > 255) return 'Máximo 255 caracteres';
              return null;
            },
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
          const SizedBox(height: 24),
          SelectorColor(
            valor: _color,
            opcional: true,
            onChanged: (nuevo) {
              setState(() => _color = nuevo);
              widget.onCambio?.call();
            },
          ),
          const SizedBox(height: 24),
          CampoSubtareas(
            titulos: _subtareas,
            onAgregar: (titulo) {
              setState(() => _subtareas.add(titulo));
              widget.onCambio?.call();
            },
            onEliminar: (indice) {
              setState(() => _subtareas.removeAt(indice));
              widget.onCambio?.call();
            },
          ),
          const SizedBox(height: 24),
          Text('Contenido', style: seccion),
          const SizedBox(height: 8),
          EditorMarkdown(
            controller: _contenido,
            hint: 'Detalles, pasos… o pulsa «/» para insertar un bloque',
            onCambio: widget.onCambio,
          ),
        ],
      ),
    );
  }
}
