import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/auth/sesion_store.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../auth/api/auth_api.dart';
import '../../../core/widgets/confirmar.dart';
import '../widgets/cambiar_password_sheet.dart';

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
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(mensaje)));
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
    final actualizado = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => CambiarPasswordSheet(authApi: widget.authApi),
    );
    if (actualizado == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Contraseña actualizada correctamente.')),
      );
    }
  }

  Future<void> _cerrarTodas() async {
    final ok = await confirmar(
      context,
      titulo: '¿Cerrar todas las sesiones?',
      mensaje: 'Tendrás que volver a iniciar sesión en todos tus dispositivos.',
      accion: 'Cerrar todas',
    );
    if (ok) await widget.authApi.cerrarTodasLasSesiones();
  }

  Widget _seccion(String titulo) => Padding(
    padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
    child: Text(
      titulo,
      style: Theme.of(
        context,
      ).textTheme.labelLarge?.copyWith(color: context.colores.tintaTenue),
    ),
  );

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final store = widget.sesionStore;
    final usuario = store.usuario;
    final inicial = (usuario != null && usuario.nombre.trim().isNotEmpty)
        ? usuario.nombre.trim()[0].toUpperCase()
        : 'U';
    final verificado = usuario?.emailVerificado ?? false;

    return Scaffold(
      appBar: AppBar(title: const Text('Perfil')),
      body: ListView(
        padding: const EdgeInsets.only(bottom: 32),
        children: <Widget>[
          ListTile(
            leading: CircleAvatar(
              backgroundColor: colores.elevada,
              foregroundColor: colores.tintaSuave,
              child: Text(inicial),
            ),
            title: Text(
              usuario?.nombre ?? 'Usuario',
              style: textTheme.titleMedium,
            ),
            subtitle: Text(usuario?.email ?? '-'),
          ),
          ListTile(
            leading: Icon(
              verificado
                  ? Icons.verified_outlined
                  : Icons.mark_email_unread_outlined,
              color: verificado
                  ? const Color(0xFF059669)
                  : const Color(0xFFD97706),
            ),
            title: Text(
              verificado ? 'Email verificado' : 'Email sin verificar',
            ),
            trailing: verificado
                ? null
                : TextButton(
                    onPressed: _enviandoVerificacion
                        ? null
                        : _reenviarVerificacion,
                    child: const Text('Reenviar'),
                  ),
          ),
          _seccion('Apariencia'),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: SegmentedButton<ThemeMode>(
              showSelectedIcon: false,
              segments: const <ButtonSegment<ThemeMode>>[
                ButtonSegment(value: ThemeMode.system, label: Text('Sistema')),
                ButtonSegment(value: ThemeMode.light, label: Text('Claro')),
                ButtonSegment(value: ThemeMode.dark, label: Text('Oscuro')),
              ],
              selected: <ThemeMode>{store.modoTema},
              onSelectionChanged: (s) => store.cambiarModoTema(s.first),
            ),
          ),
          if (store.puede('tags:leer')) ...<Widget>[
            _seccion('Organización'),
            ListTile(
              leading: const Icon(Icons.sell_outlined),
              title: const Text('Tags'),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () => context.push('/tags'),
            ),
          ],
          _seccion('Seguridad de la cuenta'),
          ListTile(
            leading: const Icon(Icons.lock_outline_rounded),
            title: const Text('Cambiar contraseña'),
            onTap: _abrirCambiarPassword,
          ),
          ListTile(
            leading: const Icon(Icons.logout_rounded),
            title: const Text('Cerrar sesión'),
            onTap: widget.authApi.logout,
          ),
          ListTile(
            leading: Icon(Icons.devices_outlined, color: colores.rosePeligro),
            title: Text(
              'Cerrar todas las sesiones',
              style: TextStyle(color: colores.rosePeligro),
            ),
            onTap: _cerrarTodas,
          ),
          const SizedBox(height: 24),
          Center(
            child: Text('Cosmoflow v$_version', style: textTheme.bodySmall),
          ),
        ],
      ),
    );
  }
}
