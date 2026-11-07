import 'package:flutter/material.dart';
import '../../../core/auth/sesion_store.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../auth/api/auth_api.dart';

/// Vista de Perfil de usuario (`/perfil`) dentro del shell autenticado.
class PerfilPage extends StatelessWidget {
  const PerfilPage({
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

    return ListView(
      padding: const EdgeInsets.all(24),
      children: <Widget>[
        Text('Mi perfil', style: textTheme.headlineSmall),
        const SizedBox(height: 4),
        Text(
          'Información de tu cuenta y preferencias de sesión.',
          style: textTheme.bodyMedium?.copyWith(color: colores.tintaTenue),
        ),
        const SizedBox(height: 24),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  usuario?.nombre ?? 'Usuario',
                  style: textTheme.titleMedium,
                ),
                const SizedBox(height: 4),
                Text(
                  usuario?.email ?? '-',
                  style: textTheme.bodyMedium?.copyWith(
                    color: colores.tintaSuave,
                  ),
                ),
                const SizedBox(height: 16),
                OutlinedButton.icon(
                  onPressed: authApi.logout,
                  icon: Icon(
                    Icons.logout_outlined,
                    size: 16,
                    color: colores.rosePeligro,
                  ),
                  label: Text(
                    'Cerrar sesión',
                    style: TextStyle(color: colores.rosePeligro),
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
