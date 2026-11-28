import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/auth/sesion_store.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/avatar_usuario.dart';
import '../../../core/widgets/avisos.dart';
import '../../../core/widgets/confirmar.dart';
import '../../../core/widgets/tarjeta_seccion.dart';
import '../../auth/api/auth_api.dart';
import '../api/perfil_api.dart';
import '../widgets/cambiar_password_sheet.dart';
import '../widgets/eliminar_cuenta_sheet.dart';

// La inyecta el build (`--dart-define=APP_VERSION=…`); en `flutter run` queda `dev`.
const _version = String.fromEnvironment('APP_VERSION', defaultValue: 'dev');

/// Vista `/perfil` agrupada en tarjetas estilo iOS/Notion: cuenta, apariencia,
/// preferencias y seguridad.
class PerfilPage extends StatefulWidget {
  const PerfilPage({
    super.key,
    required this.sesionStore,
    required this.authApi,
    this.perfilApi,
  });

  final SesionStore sesionStore;
  final AuthApi authApi;
  final PerfilApi? perfilApi;

  @override
  State<PerfilPage> createState() => _PerfilPageState();
}

class _PerfilPageState extends State<PerfilPage> {
  late final PerfilApi _perfilApi =
      widget.perfilApi ?? PerfilApi(apiClient: widget.authApi.apiClient);
  bool _enviandoVerificacion = false;
  bool _actualizandoAvatar = false;

  Future<void> _reenviarVerificacion() async {
    setState(() => _enviandoVerificacion = true);
    try {
      final mensaje = await widget.authApi.reenviarVerificacionEmail();
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(mensaje)));
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

  Future<void> _gestionarAvatar() async {
    if (_actualizandoAvatar) return;
    final tieneAvatar = widget.sesionStore.usuario?.avatarUrl != null;
    final opcion = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      useSafeArea: true,
      builder: (ctx) => SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            ListTile(
              leading: const Icon(LucideIcons.image, size: 20),
              title: const Text('Elegir foto de la galería'),
              onTap: () => Navigator.of(ctx).pop('galeria'),
            ),
            ListTile(
              leading: const Icon(LucideIcons.camera, size: 20),
              title: const Text('Tomar foto'),
              onTap: () => Navigator.of(ctx).pop('camara'),
            ),
            if (tieneAvatar)
              ListTile(
                leading: Icon(
                  LucideIcons.trash2,
                  size: 20,
                  color: ctx.colores.rosePeligro,
                ),
                title: Text(
                  'Quitar foto de perfil',
                  style: TextStyle(color: ctx.colores.rosePeligro),
                ),
                onTap: () => Navigator.of(ctx).pop('quitar'),
              ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
    if (opcion == null || !mounted) return;

    if (opcion == 'quitar') {
      setState(() => _actualizandoAvatar = true);
      try {
        await ejecutarConAviso(
          context,
          () async {
            final actualizado = await _perfilApi.eliminarAvatar();
            widget.sesionStore.actualizarUsuario(actualizado);
          },
          error: 'No se pudo quitar la foto de perfil.',
          exito: 'Foto de perfil eliminada.',
        );
      } finally {
        if (mounted) setState(() => _actualizandoAvatar = false);
      }
      return;
    }

    final picker = ImagePicker();
    final archivo = await picker.pickImage(
      source: opcion == 'camara' ? ImageSource.camera : ImageSource.gallery,
      maxWidth: 1024,
      imageQuality: 85,
    );
    if (archivo == null || !mounted) return;

    setState(() => _actualizandoAvatar = true);
    try {
      final bytes = await archivo.readAsBytes();
      if (!mounted) return;
      await ejecutarConAviso(
        context,
        () async {
          final actualizado = await _perfilApi.subirAvatar(
            bytes: bytes,
            nombreArchivo: archivo.name,
          );
          widget.sesionStore.actualizarUsuario(actualizado);
        },
        error: 'No se pudo subir la imagen (máx. 2 MB, PNG/JPEG/WebP).',
        exito: 'Foto de perfil actualizada.',
      );
    } finally {
      if (mounted) setState(() => _actualizandoAvatar = false);
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

  Future<void> _abrirEliminarCuenta() async {
    await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      useSafeArea: true,
      builder: (_) => EliminarCuentaSheet(
        perfilApi: _perfilApi,
        sesionStore: widget.sesionStore,
      ),
    );
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

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final store = widget.sesionStore;
    final usuario = store.usuario;
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
                    InkWell(
                      onTap: _gestionarAvatar,
                      borderRadius: BorderRadius.circular(30),
                      child: Stack(
                        children: <Widget>[
                          AvatarUsuario(
                            nombre: usuario?.nombre ?? 'Usuario',
                            avatarUrl: usuario?.avatarUrl,
                            tamano: 54,
                          ),
                          Positioned(
                            right: 0,
                            bottom: 0,
                            child: Container(
                              width: 20,
                              height: 20,
                              decoration: BoxDecoration(
                                color: colores.indigoMarca,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: colores.superficie,
                                  width: 2,
                                ),
                              ),
                              alignment: Alignment.center,
                              child: Icon(
                                LucideIcons.camera,
                                size: 11,
                                color: colores.sobreAcento,
                              ),
                            ),
                          ),
                        ],
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
            titulo: 'Preferencias y herramientas',
            divisorIndent: 64,
            children: <Widget>[
              _FilaPerfil(
                icono: LucideIcons.bell,
                colorIcono: colores.indigoMarca,
                fondoIcono: colores.indigoSuave,
                titulo: 'Notificaciones',
                onTap: () => context.push('/perfil/notificaciones'),
              ),
              if (store.puede('tareas:leer'))
                _FilaPerfil(
                  icono: LucideIcons.calendarSync,
                  colorIcono: colores.indigoMarca,
                  fondoIcono: colores.indigoSuave,
                  titulo: 'Calendario iCalendar',
                  onTap: () => context.push('/perfil/calendario'),
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
              if (store.puede('tareas:leer') || store.puede('notas:leer'))
                _FilaPerfil(
                  icono: LucideIcons.trash2,
                  colorIcono: colores.rosePeligro,
                  fondoIcono: colores.roseSuave,
                  titulo: 'Papelera',
                  onTap: () => context.push('/papelera'),
                ),
            ],
          ),
          const SizedBox(height: 16),
          TarjetaSeccion(
            titulo: 'Seguridad de la cuenta',
            divisorIndent: 64,
            children: <Widget>[
              _FilaPerfil(
                icono: LucideIcons.shieldCheck,
                colorIcono: colores.emeraldExito,
                fondoIcono: colores.emeraldSuave,
                titulo: 'Verificación en dos pasos',
                onTap: () => context.push('/perfil/dos-pasos'),
              ),
              _FilaPerfil(
                icono: LucideIcons.smartphone,
                titulo: 'Sesiones activas',
                onTap: () => context.push('/perfil/sesiones'),
              ),
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
                icono: LucideIcons.logOut,
                colorIcono: colores.rosePeligro,
                fondoIcono: colores.roseSuave,
                colorTexto: colores.rosePeligro,
                titulo: 'Cerrar todas las sesiones',
                mostrarChevron: false,
                onTap: _cerrarTodas,
              ),
              _FilaPerfil(
                icono: LucideIcons.userX,
                colorIcono: colores.rosePeligro,
                fondoIcono: colores.roseSuave,
                colorTexto: colores.rosePeligro,
                titulo: 'Eliminar cuenta',
                mostrarChevron: false,
                onTap: _abrirEliminarCuenta,
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
      leading: IconoCaja(icono: icono, color: colorIcono, fondo: fondoIcono),
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
