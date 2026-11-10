import 'package:flutter/material.dart';
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

/// Bottom sheet (2 campos) para crear o editar un tag personal.
class TagFormSheet extends StatefulWidget {
  const TagFormSheet({super.key, this.tagInicial});

  final TagDto? tagInicial;

  @override
  State<TagFormSheet> createState() => _TagFormSheetState();
}

class _TagFormSheetState extends State<TagFormSheet> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  late final TextEditingController _nombreController;
  String? _colorSeleccionado;

  @override
  void initState() {
    super.initState();
    _nombreController = TextEditingController(
      text: widget.tagInicial?.nombre ?? '',
    );
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
    final textTheme = Theme.of(context).textTheme;
    final esEdicion = widget.tagInicial != null;

    return Padding(
      padding: EdgeInsets.fromLTRB(
        16,
        0,
        16,
        16 + MediaQuery.viewInsetsOf(context).bottom,
      ),
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
            TextFormField(
              controller: _nombreController,
              autofocus: !esEdicion,
              textCapitalization: TextCapitalization.sentences,
              textInputAction: TextInputAction.done,
              onFieldSubmitted: (_) => _guardar(),
              decoration: const InputDecoration(
                labelText: 'Nombre',
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
            Text('Color', style: textTheme.labelLarge),
            const SizedBox(height: 4),
            Wrap(
              crossAxisAlignment: WrapCrossAlignment.center,
              children: <Widget>[
                ChoiceChip(
                  label: const Text('Sin color'),
                  selected:
                      _colorSeleccionado == null || _colorSeleccionado!.isEmpty,
                  onSelected: (_) => setState(() => _colorSeleccionado = null),
                ),
                for (final hex in _coloresPreset)
                  IconButton(
                    tooltip: hex,
                    onPressed: () => setState(() => _colorSeleccionado = hex),
                    icon: Icon(
                      _colorSeleccionado == hex
                          ? Icons.check_circle_rounded
                          : Icons.circle,
                      color: _hexAColor(hex),
                      size: 32,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            FilledButton(onPressed: _guardar, child: const Text('Guardar')),
          ],
        ),
      ),
    );
  }
}
