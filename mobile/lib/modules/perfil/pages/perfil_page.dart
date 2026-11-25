import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/auth/sesion_store.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/confirmar.dart';
import '../../../core/widgets/tarjeta_seccion.dart';
import '../../auth/api/auth_api.dart';
import '../widgets/cambiar_password_sheet.dart';

// La inyecta el build (`--dart-define=APP_VERSION=…`); en `flutter run` queda `dev`.
const _version = String.fromEnvironment('APP_VERSION', defaultValue: 'dev');

/// Vista `/perfil` agrupada en tarjetas estilo iOS/Notion: cuenta, apariencia,
/// preferencias y seguridad.
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
      if (mounted) setState(() => _enviandoVerificacion = false);
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
      mensaje:
          'Tendrás que volver a iniciar sesión en todos tus dispositivos.',
      accion: 'Cerrar todas',
    );
    if (ok) await widget.authApi.cerrarTodasLasSesiones();
  }

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
        padding: const EdgeInsets.only(top: 8, bottom: 40),
        children: <Widget>[
          TarjetaSeccion(
            mostrarDivisores: true,
            divisorIndent: 16,
            children: <Widget>[
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: <Widget>[
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: colores.indigoSuave,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        inicial,
                        style: textTheme.headlineSmall?.copyWith(
                          color: colores.indigoMarca,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text(
                            usuario?.nombre ?? 'Usuario',
                            style: textTheme.titleMedium,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            usuario?.email ?? '-',
                            style: textTheme.bodySmall,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 8),
                          InsigniaPill(
                            texto: verificado
                                ? 'Email verificado'
                                : 'Email sin verificar',
                            icono: verificado
                                ? LucideIcons.badgeCheck
                                : LucideIcons.mailWarning,
                            colorTexto: verificado
                                ? colores.emeraldExito
                                : colores.amberAviso,
                            colorFondo: verificado
                                ? colores.emeraldSuave
                                : colores.amberSuave,
                          ),
                        ],
                      ),
                    ),
                    if (!verificado)
                      TextButton(
                        onPressed: _enviandoVerificacion
                            ? null
                            : _reenviarVerificacion,
                        child: const Text('Reenviar'),
                      ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          TarjetaSeccion(
            titulo: 'Apariencia',
            paddingInterno: const EdgeInsets.all(12),
            mostrarDivisores: false,
            children: <Widget>[
              SegmentedButton<ThemeMode>(
                showSelectedIcon: false,
                segments: const <ButtonSegment<ThemeMode>>[
                  ButtonSegment(
                    value: ThemeMode.system,
                    icon: Icon(LucideIcons.monitor, size: 15),
                    label: Text('Sistema'),
                  ),
                  ButtonSegment(
                    value: ThemeMode.light,
                    icon: Icon(LucideIcons.sun, size: 15),
                    label: Text('Claro'),
                  ),
                  ButtonSegment(
                    value: ThemeMode.dark,
                    icon: Icon(LucideIcons.moon, size: 15),
                    label: Text('Oscuro'),
                  ),
                ],
                selected: <ThemeMode>{store.modoTema},
                onSelectionChanged: (s) => store.cambiarModoTema(s.first),
              ),
            ],
          ),
          const SizedBox(height: 16),
          TarjetaSeccion(
            titulo: 'Preferencias',
            divisorIndent: 64,
            children: <Widget>[
              _FilaPerfil(
                icono: LucideIcons.bell,
                colorIcono: colores.indigoMarca,
                fondoIcono: colores.indigoSuave,
                titulo: 'Notificaciones',
                onTap: () => context.push('/perfil/notificaciones'),
              ),
              if (store.puede('tags:leer'))
                _FilaPerfil(
                  icono: LucideIcons.tag,
                  colorIcono: colores.emeraldExito,
                  fondoIcono: colores.emeraldSuave,
                  titulo: 'Tags',
                  onTap: () => context.push('/tags'),
                ),
              if (store.puede('tareas:leer'))
                _FilaPerfil(
                  icono: LucideIcons.layoutTemplate,
                  colorIcono: colores.amberAviso,
                  fondoIcono: colores.amberSuave,
                  titulo: 'Plantillas',
                  onTap: () => context.push('/plantillas'),
                ),
            ],
          ),
          const SizedBox(height: 16),
          TarjetaSeccion(
            titulo: 'Seguridad de la cuenta',
            divisorIndent: 64,
            children: <Widget>[
              _FilaPerfil(
                icono: LucideIcons.keyRound,
                titulo: 'Cambiar contraseña',
                onTap: _abrirCambiarPassword,
              ),
              _FilaPerfil(
                icono: LucideIcons.logOut,
                titulo: 'Cerrar sesión',
                mostrarChevron: false,
                onTap: widget.authApi.logout,
              ),
              _FilaPerfil(
                icono: LucideIcons.smartphone,
                colorIcono: colores.rosePeligro,
                fondoIcono: colores.roseSuave,
                colorTexto: colores.rosePeligro,
                titulo: 'Cerrar todas las sesiones',
                mostrarChevron: false,
                onTap: _cerrarTodas,
              ),
            ],
          ),
          const SizedBox(height: 28),
          Center(
            child: Text(
              'Cosmoflow v$_version',
              style: textTheme.bodySmall?.copyWith(color: colores.tintaTenue),
            ),
          ),
        ],
      ),
    );
  }
}

class _FilaPerfil extends StatelessWidget {
  const _FilaPerfil({
    required this.icono,
    required this.titulo,
    required this.onTap,
    this.colorIcono,
    this.fondoIcono,
    this.colorTexto,
    this.mostrarChevron = true,
  });

  final IconData icono;
  final String titulo;
  final VoidCallback onTap;
  final Color? colorIcono;
  final Color? fondoIcono;
  final Color? colorTexto;
  final bool mostrarChevron;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    return ListTile(
      onTap: onTap,
      leading: IconoCaja(
        icono: icono,
        color: colorIcono,
        fondo: fondoIcono,
      ),
      title: Text(
        titulo,
        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
          fontWeight: FontWeight.w500,
          color: colorTexto ?? colores.tinta,
        ),
      ),
      trailing: mostrarChevron
          ? Icon(LucideIcons.chevronRight, size: 18, color: colores.tintaTenue)
          : null,
    );
  }
}
