import 'package:flutter/material.dart';
import '../../../core/theme/colores_noche_indigo.dart';

/// Vista de Notas personales (`/notas`) dentro del shell autenticado.
class NotasPage extends StatelessWidget {
  const NotasPage({super.key});

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;

    return ListView(
      padding: const EdgeInsets.all(24),
      children: <Widget>[
        Text('Notas', style: textTheme.headlineSmall),
        const SizedBox(height: 4),
        Text(
          'Tus apuntes y documentos en Markdown.',
          style: textTheme.bodyMedium?.copyWith(color: colores.tintaTenue),
        ),
        const SizedBox(height: 24),
        Card(
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
                Text('Notas personales', style: textTheme.titleMedium),
                const SizedBox(height: 4),
                Text(
                  'Aquí podrás buscar, leer y editar tus notas.',
                  textAlign: TextAlign.center,
                  style: textTheme.bodyMedium?.copyWith(
                    color: colores.tintaTenue,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
