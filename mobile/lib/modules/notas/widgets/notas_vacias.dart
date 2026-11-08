import 'package:flutter/material.dart';
import '../../../core/theme/colores_noche_indigo.dart';

/// Estado vacío de la lista de notas.
class NotasVacias extends StatelessWidget {
  const NotasVacias({super.key});

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: <Widget>[
            Icon(
              Icons.sticky_note_2_outlined,
              size: 32,
              color: colores.tintaTenue,
            ),
            const SizedBox(height: 12),
            Text('Sin notas', style: textTheme.titleMedium),
            const SizedBox(height: 4),
            Text(
              'Crea una nota para guardar apuntes e ideas.',
              textAlign: TextAlign.center,
              style: textTheme.bodyMedium?.copyWith(color: colores.tintaTenue),
            ),
          ],
        ),
      ),
    );
  }
}
