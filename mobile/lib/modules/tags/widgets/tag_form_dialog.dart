import 'package:flutter/material.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../models/tag_model.dart';

/// Valores devueltos por el formulario de crear o editar tag.
class TagFormValores {
  const TagFormValores({required this.nombre, this.color});

  final String nombre;
  final String? color;
}

const List<String> _coloresPreset = <String>[
  '#4F46E5',
  '#E11D48',
  '#059669',
  '#D97706',
  '#0284C7',
];

/// Diálogo modal para crear o editar un tag personal.
class TagFormDialog extends StatefulWidget {
  const TagFormDialog({super.key, this.tagInicial});

  final TagDto? tagInicial;

  @override
  State<TagFormDialog> createState() => _TagFormDialogState();
}

class _TagFormDialogState extends State<TagFormDialog> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  late final TextEditingController _nombreController;
  String? _colorSeleccionado;

  @override
  void initState() {
    super.initState();
    _nombreController =
        TextEditingController(text: widget.tagInicial?.nombre ?? '');
    _colorSeleccionado = widget.tagInicial?.color;
  }

  @override
  void dispose() {
    _nombreController.dispose();
    super.dispose();
  }

  static Color _hexAColor(String hex) {
    final limpio = hex.replaceFirst('#', '');
    return Color(int.parse('FF$limpio', radix: 16));
  }

  void _guardar() {
    final form = _formKey.currentState;
    if (form == null || !form.validate()) return;

    Navigator.of(context).pop(
      TagFormValores(
        nombre: _nombreController.text.trim(),
        color: _colorSeleccionado,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final esEdicion = widget.tagInicial != null;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 380),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: <Widget>[
                Text(
                  esEdicion ? 'Editar tag' : 'Nuevo tag',
                  style: textTheme.titleMedium,
                ),
                const SizedBox(height: 16),
                Text('Nombre', style: textTheme.labelMedium),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _nombreController,
                  decoration: const InputDecoration(
                    hintText: 'Ej. Urgente, Backend, Diseño',
                  ),
                  validator: (valor) {
                    final texto = valor?.trim() ?? '';
                    if (texto.isEmpty) return 'El nombre es obligatorio';
                    if (texto.length > 64) return 'Máximo 64 caracteres';
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                Text('Color opcional', style: textTheme.labelMedium),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 10,
                  runSpacing: 8,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: <Widget>[
                    ChoiceChip(
                      label: const Text('Sin color'),
                      selected:
                          _colorSeleccionado == null ||
                          _colorSeleccionado!.isEmpty,
                      onSelected: (_) {
                        setState(() => _colorSeleccionado = null);
                      },
                    ),
                    for (final hex in _coloresPreset)
                      GestureDetector(
                        onTap: () {
                          setState(() => _colorSeleccionado = hex);
                        },
                        child: Container(
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            color: _hexAColor(hex),
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: _colorSeleccionado == hex
                                  ? colores.tinta
                                  : Colors.transparent,
                              width: 2,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 24),
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
