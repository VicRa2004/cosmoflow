import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/avisos.dart';
import '../../../core/widgets/confirmar.dart';
import '../../../core/widgets/estados.dart';
import '../../../core/widgets/tarjeta_seccion.dart';
import '../../auth/api/auth_api.dart';
import '../api/perfil_api.dart';
import '../models/perfil_models.dart';

/// `/perfil/sesiones`: lista sesiones activas y permite revocarlas individualmente o todas.
class SesionesActivasPage extends StatefulWidget {
  const SesionesActivasPage({
    super.key,
    required this.perfilApi,
    required this.authApi,
    this.cargarAlIniciar = true,
  });

  final PerfilApi perfilApi;
  final AuthApi authApi;
  final bool cargarAlIniciar;

  @override
  State<SesionesActivasPage> createState() => _SesionesActivasPageState();
}

class _SesionesActivasPageState extends State<SesionesActivasPage> {
  List<SesionActivaDto> _sesiones = const <SesionActivaDto>[];
  bool _cargando = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (widget.cargarAlIniciar) _cargar();
  }

  Future<void> _cargar() async {
    setState(() {
      _cargando = true;
      _error = null;
    });
    try {
      final lista = await widget.perfilApi.obtenerSesiones();
      if (mounted) setState(() => _sesiones = lista);
    } catch (_) {
      if (mounted) {
        setState(() => _error = 'No se pudieron cargar las sesiones activas.');
      }
    } finally {
      if (mounted) setState(() => _cargando = false);
    }
  }

  Future<void> _cerrarSesion(SesionActivaDto sesion) async {
    final ok = await confirmar(
      context,
      titulo: '¿Cerrar esta sesión?',
      mensaje: sesion.isActual ? 'Se cerrará tu sesión en este dispositivo.' : 'El dispositivo perderá el acceso y tendrá que volver a iniciar sesión.',
      accion: 'Cerrar sesión',
    );
    if (!ok || !mounted) return;
    final hecho = await ejecutarConAviso(
      context,
      () => widget.perfilApi.cerrarSesion(sesion.id),
      error: 'No se pudo cerrar la sesión.',
      exito: 'Sesión cerrada.',
    );
    if (hecho && mounted) {
      if (sesion.isActual) {
        await widget.authApi.logout();
      } else {
        await _cargar();
      }
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

  String _formatoFecha(DateTime fecha) {
    final l = fecha.toLocal();
    final d = l.day.toString().padLeft(2, '0');
    final m = l.month.toString().padLeft(2, '0');
    final h = l.hour.toString().padLeft(2, '0');
    final min = l.minute.toString().padLeft(2, '0');
    return '$d/$m/${l.year} · $h:$min';
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Sesiones activas')),
      body: RefreshIndicator(
        onRefresh: _cargar,
        child: _cargando && _sesiones.isEmpty
            ? const EstadoCargando()
            : _error != null && _sesiones.isEmpty
            ? EstadoError(mensaje: _error!, onReintentar: _cargar)
            : _sesiones.isEmpty
            ? const EstadoVacio(
                icono: LucideIcons.smartphone,
                titulo: 'Sin sesiones activas',
                mensaje: 'No hay sesiones registradas en tu cuenta.',
              )
            : ListView(
                padding: const EdgeInsets.only(top: 8, bottom: 40),
                children: <Widget>[
                  TarjetaSeccion(
                    titulo: 'Dispositivos conectados',
                    contador: _sesiones.length,
                    divisorIndent: 64,
                    children: <Widget>[
                      for (final s in _sesiones)
                        ListTile(
                          leading: IconoCaja(
                            icono: LucideIcons.smartphone,
                            color: s.isActual
                                ? colores.indigoMarca
                                : colores.tintaSuave,
                            fondo: s.isActual
                                ? colores.indigoSuave
                                : colores.elevada,
                          ),
                          title: Row(
                            children: <Widget>[
                              Expanded(
                                child: Text(
                                  s.isActual
                                      ? 'Sesión actual'
                                      : 'Sesión #${s.id}',
                                  style: textTheme.bodyLarge?.copyWith(
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                              if (s.isActual)
                                InsigniaPill(
                                  texto: 'Actual',
                                  colorTexto: colores.emeraldExito,
                                  colorFondo: colores.emeraldSuave,
                                ),
                            ],
                          ),
                          subtitle: Text(
                            'Iniciada: ${_formatoFecha(s.createdAt)}\nExpira: ${_formatoFecha(s.expiraEn)}',
                            style: textTheme.bodySmall,
                          ),
                          isThreeLine: true,
                          trailing: IconButton(
                            tooltip: 'Cerrar sesión',
                            onPressed: () => _cerrarSesion(s),
                            icon: Icon(
                              LucideIcons.logOut,
                              size: 18,
                              color: colores.rosePeligro,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: OutlinedButton.icon(
                      onPressed: _cerrarTodas,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: colores.rosePeligro,
                        side: BorderSide(
                          color: colores.rosePeligro.withValues(alpha: 0.4),
                        ),
                      ),
                      icon: const Icon(LucideIcons.logOut, size: 18),
                      label: const Text('Cerrar todas las sesiones'),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
