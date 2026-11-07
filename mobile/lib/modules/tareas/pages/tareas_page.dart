import 'package:flutter/material.dart';
import '../../../core/theme/colores_noche_indigo.dart';

/// Vista de Tareas (`/tareas`) dentro del shell autenticado.
class TareasPage extends StatelessWidget {
  const TareasPage({super.key});

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;

    return ListView(
      padding: const EdgeInsets.all(24),
      children: <Widget>[
        Text('Tareas', style: textTheme.headlineSmall),
        const SizedBox(height: 4),
        Text(
          'Gestiona tus tareas personales, asignadas y de equipo.',
          style: textTheme.bodyMedium?.copyWith(color: colores.tintaTenue),
        ),
        const SizedBox(height: 24),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: <Widget>[
                Icon(
                  Icons.checklist_rounded,
                  size: 32,
                  color: colores.tintaTenue,
                ),
                const SizedBox(height: 12),
                Text('Listado de tareas', style: textTheme.titleMedium),
                const SizedBox(height: 4),
                Text(
                  'Aquí se mostrarán tus tareas sincronizadas con Cosmoflow.',
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
