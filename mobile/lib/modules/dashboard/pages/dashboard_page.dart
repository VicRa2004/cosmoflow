import 'package:flutter/material.dart';
import '../../../core/auth/sesion_store.dart';
import '../../../core/theme/colores_noche_indigo.dart';

/// Vista principal autenticada (`/dashboard`) dentro de `MainShell`.
class DashboardPage extends StatelessWidget {
  const DashboardPage({
    super.key,
    required this.sesionStore,
  });

  final SesionStore sesionStore;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final usuario = sesionStore.usuario;

    return ListView(
      padding: const EdgeInsets.all(24),
      children: <Widget>[
        Text(
          'Hola, ${usuario?.nombre ?? 'Usuario'}',
          style: textTheme.headlineSmall,
        ),
        const SizedBox(height: 4),
        Text(
          'Resumen de tus pendientes y actividad en Cosmoflow.',
          style: textTheme.bodyMedium?.copyWith(color: colores.tintaTenue),
        ),
        const SizedBox(height: 24),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text('Sesión activa', style: textTheme.titleMedium),
                const SizedBox(height: 8),
                Text(
                  'Email: ${usuario?.email ?? '-'}',
                  style: textTheme.bodyMedium?.copyWith(
                    color: colores.tintaSuave,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Roles: ${usuario != null && usuario.roles.isNotEmpty ? usuario.roles.join(', ') : 'usuario'}',
                  style: textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
