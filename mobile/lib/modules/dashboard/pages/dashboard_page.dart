import 'package:flutter/material.dart';
import '../../../core/auth/sesion_store.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../auth/api/auth_api.dart';

/// Vista principal autenticada (`/dashboard`) con encabezado y estado de sesión.
class DashboardPage extends StatelessWidget {
  const DashboardPage({
    super.key,
    required this.sesionStore,
    required this.authApi,
  });

  final SesionStore sesionStore;
  final AuthApi authApi;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final usuario = sesionStore.usuario;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pendientes'),
        actions: <Widget>[
          IconButton(
            tooltip: 'Cambiar tema',
            onPressed: () {
              final actual = sesionStore.modoTema;
              final siguiente = actual == ThemeMode.dark
                  ? ThemeMode.light
                  : ThemeMode.dark;
              sesionStore.cambiarModoTema(siguiente);
            },
            icon: Icon(
              Theme.of(context).brightness == Brightness.dark
                  ? Icons.light_mode_outlined
                  : Icons.dark_mode_outlined,
              size: 20,
              color: colores.tintaSuave,
            ),
          ),
          IconButton(
            tooltip: 'Cerrar sesión',
            onPressed: authApi.logout,
            icon: Icon(
              Icons.logout_outlined,
              size: 20,
              color: colores.tintaSuave,
            ),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Text('Hola, ${usuario?.nombre ?? 'Usuario'}',
                style: textTheme.headlineSmall),
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
        ),
      ),
    );
  }
}
