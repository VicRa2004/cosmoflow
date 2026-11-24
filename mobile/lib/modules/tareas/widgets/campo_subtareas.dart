import 'package:flutter/material.dart';

import '../../../core/theme/colores_noche_indigo.dart';

/// Editor de lista de subtareas (checklist) reutilizado en tareas y plantillas.
class CampoSubtareas extends StatefulWidget {
  const CampoSubtareas({
    super.key,
    required this.titulos,
    required this.onAgregar,
    required this.onEliminar,
  });

  final List<String> titulos;
  final ValueChanged<String> onAgregar;
  final ValueChanged<int> onEliminar;

  @override
  State<CampoSubtareas> createState() => _CampoSubtareasState();
}

class _CampoSubtareasState extends State<CampoSubtareas> {
  final TextEditingController _nueva = TextEditingController();

  @override
  void dispose() {
    _nueva.dispose();
    super.dispose();
  }

  void _enviar() {
    final texto = _nueva.text.trim();
    if (texto.isEmpty || widget.titulos.length >= 100) return;
    widget.onAgregar(texto);
    _nueva.clear();
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final limiteAlcanzado = widget.titulos.length >= 100;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(
          'Checklist',
          style: textTheme.labelLarge?.copyWith(color: colores.tintaTenue),
        ),
        const SizedBox(height: 8),
        for (var i = 0; i < widget.titulos.length; i++)
          ListTile(
            dense: true,
            contentPadding: EdgeInsets.zero,
            leading: Icon(
              Icons.check_box_outline_blank_rounded,
              size: 20,
              color: colores.tintaTenue,
            ),
            title: Text(widget.titulos[i], style: textTheme.bodyMedium),
            trailing: IconButton(
              tooltip: 'Quitar subtarea',
              onPressed: () => widget.onEliminar(i),
              icon: const Icon(Icons.close_rounded, size: 20),
            ),
          ),
        Row(
          children: <Widget>[
            Expanded(
              child: TextField(
                controller: _nueva,
                enabled: !limiteAlcanzado,
                textCapitalization: TextCapitalization.sentences,
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => _enviar(),
                decoration: InputDecoration(
                  hintText: limiteAlcanzado
                      ? 'Máximo 100 subtareas'
                      : 'Añadir elemento al checklist',
                ),
              ),
            ),
            const SizedBox(width: 8),
            IconButton.filledTonal(
              tooltip: 'Añadir subtarea',
              onPressed: limiteAlcanzado ? null : _enviar,
              icon: const Icon(Icons.add_rounded),
            ),
          ],
        ),
      ],
    );
  }
}
