import 'package:flutter/material.dart';
import '../../../core/theme/colores_noche_indigo.dart';

/// Vista de Tags personales (`/tags`) dentro del shell autenticado.
class TagsPage extends StatelessWidget {
  const TagsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;

    return ListView(
      padding: const EdgeInsets.all(24),
      children: <Widget>[
        Text('Tags', style: textTheme.headlineSmall),
        const SizedBox(height: 4),
        Text(
          'Etiquetas personales para clasificar tareas y notas.',
          style: textTheme.bodyMedium?.copyWith(color: colores.tintaTenue),
        ),
        const SizedBox(height: 24),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: <Widget>[
                Icon(
                  Icons.sell_outlined,
                  size: 32,
                  color: colores.tintaTenue,
                ),
                const SizedBox(height: 12),
                Text('Etiquetas personales', style: textTheme.titleMedium),
                const SizedBox(height: 4),
                Text(
                  'Organiza tus tareas y notas con colores y etiquetas.',
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
