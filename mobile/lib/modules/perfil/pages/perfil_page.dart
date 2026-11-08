import 'package:flutter/material.dart';
import '../../../core/auth/sesion_store.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../auth/api/auth_api.dart';
import '../widgets/cambiar_password_dialog.dart';

// La inyecta el build (`--dart-define=APP_VERSION=…`); en `flutter run` queda `dev`.
const _version = String.fromEnvironment('APP_VERSION', defaultValue: 'dev');

/// Vista `/perfil` con datos de cuenta, tema (Claro / Oscuro / Sistema) y seguridad.
class PerfilPage extends StatefulWidget {
  const PerfilPage({
    super.key,
    required this.sesionStore,
    required this.authApi,
  });

  final SesionStore sesionStore;
  final AuthApi authApi;

  @override
  State<PerfilPage> createState() => _PerfilPageState();
}

class _PerfilPageState extends State<PerfilPage> {
  bool _enviandoVerificacion = false;

  Future<void> _reenviarVerificacion() async {
    setState(() => _enviandoVerificacion = true);
    try {
      final mensaje = await widget.authApi.reenviarVerificacionEmail();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(mensaje)),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('No se pudo reenviar el correo de verificación.'),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _enviandoVerificacion = false);
      }
    }
  }

  Future<void> _abrirCambiarPassword() async {
    final actualizado = await showDialog<bool>(
      context: context,
      builder: (_) => CambiarPasswordDialog(authApi: widget.authApi),
    );
    if (actualizado == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Contraseña actualizada correctamente.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final usuario = widget.sesionStore.usuario;
    final inicial = (usuario != null && usuario.nombre.trim().isNotEmpty)
        ? usuario.nombre.trim()[0].toUpperCase()
        : 'U';
    final verificado = usuario?.emailVerificado ?? false;

    return ListView(
      padding: const EdgeInsets.all(24),
      children: <Widget>[
        Text('Mi perfil', style: textTheme.headlineSmall),
        const SizedBox(height: 4),
        Text(
          'Información de tu cuenta, apariencia y seguridad.',
          style: textTheme.bodyMedium?.copyWith(color: colores.tintaTenue),
        ),
        const SizedBox(height: 20),

        // 1. Tarjeta de datos generales de la cuenta
        Card(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Row(
                  children: <Widget>[
                    CircleAvatar(
                      radius: 20,
                      backgroundColor: colores.elevada,
                      child: Text(
                        inicial,
                        style: TextStyle(
                          color: colores.tintaSuave,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text(
                            usuario?.nombre ?? 'Usuario',
                            style: textTheme.titleMedium,
                          ),
                          Text(
                            usuario?.email ?? '-',
                            style: textTheme.bodyMedium?.copyWith(
                              color: colores.tintaSuave,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Divider(color: colores.borde, height: 1),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 12,
                  runSpacing: 8,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: <Widget>[
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: verificado
                            ? const Color(0xFF059669).withValues(alpha: 0.12)
                            : const Color(0xFFD97706).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: colores.borde, width: 1),
                      ),
                      child: Text(
                        verificado ? 'Email verificado' : 'Email sin verificar',
                        style: TextStyle(
                          color: verificado
                              ? const Color(0xFF059669)
                              : const Color(0xFFD97706),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                    if (!verificado)
                      OutlinedButton(
                        onPressed:
                            _enviandoVerificacion ? null : _reenviarVerificacion,
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size(0, 32),
                          padding: const EdgeInsets.symmetric(horizontal: 10),
                        ),
                        child: const Text(
                          'Reenviar verificación',
                          style: TextStyle(fontSize: 12),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // 2. Tarjeta de Apariencia (Tema Claro / Oscuro / Sistema)
        Card(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text('Apariencia', style: textTheme.titleMedium),
                const SizedBox(height: 4),
                Text(
                  'Elige cómo se muestra Cosmoflow en este dispositivo.',
                  style: textTheme.bodySmall,
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: <Widget>[
                    ChoiceChip(
                      label: const Text('Sistema'),
                      selected:
                          widget.sesionStore.modoTema == ThemeMode.system,
                      onSelected: (_) => widget.sesionStore
                          .cambiarModoTema(ThemeMode.system),
                    ),
                    ChoiceChip(
                      label: const Text('Claro'),
                      selected: widget.sesionStore.modoTema == ThemeMode.light,
                      onSelected: (_) =>
                          widget.sesionStore.cambiarModoTema(ThemeMode.light),
                    ),
                    ChoiceChip(
                      label: const Text('Oscuro'),
                      selected: widget.sesionStore.modoTema == ThemeMode.dark,
                      onSelected: (_) =>
                          widget.sesionStore.cambiarModoTema(ThemeMode.dark),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // 3. Tarjeta de Seguridad de la Cuenta
        Card(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text('Seguridad de la cuenta', style: textTheme.titleMedium),
                const SizedBox(height: 4),
                Text(
                  'Actualiza tu contraseña o gestiona tus sesiones abiertas.',
                  style: textTheme.bodySmall,
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: <Widget>[
                    OutlinedButton.icon(
                      onPressed: _abrirCambiarPassword,
                      icon: const Icon(Icons.lock_outline_rounded, size: 16),
                      label: const Text('Cambiar contraseña'),
                    ),
                    OutlinedButton.icon(
                      onPressed: widget.authApi.logout,
                      icon: const Icon(Icons.logout_outlined, size: 16),
                      label: const Text('Cerrar sesión'),
                    ),
                    TextButton.icon(
                      onPressed: widget.authApi.cerrarTodasLasSesiones,
                      icon: Icon(
                        Icons.devices_outlined,
                        size: 16,
                        color: colores.rosePeligro,
                      ),
                      label: Text(
                        'Cerrar todas las sesiones',
                        style: TextStyle(color: colores.rosePeligro),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        Center(
          child: Text('Cosmoflow v$_version', style: textTheme.bodySmall),
        ),
      ],
    );
  }
}
