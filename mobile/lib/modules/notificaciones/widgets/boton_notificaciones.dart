import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../api/notificaciones_api.dart';

/// Campana en la AppBar con contador de notificaciones sin leer.
/// Al pulsar abre `/notificaciones` y refresca el contador al volver.
class BotonNotificaciones extends StatefulWidget {
  const BotonNotificaciones({
    super.key,
    required this.notificacionesApi,
    this.cargarAlIniciar = true,
  });

  final NotificacionesApi notificacionesApi;
  final bool cargarAlIniciar;

  @override
  State<BotonNotificaciones> createState() => _BotonNotificacionesState();
}

class _BotonNotificacionesState extends State<BotonNotificaciones> {
  int _noLeidas = 0;

  @override
  void initState() {
    super.initState();
    if (widget.cargarAlIniciar) _refrescarContador();
  }

  Future<void> _refrescarContador() async {
    try {
      final bandeja = await widget.notificacionesApi.obtenerBandeja(limite: 1);
      if (mounted) setState(() => _noLeidas = bandeja.noLeidas);
    } catch (_) {
      // Sin conexión: se mantiene el último valor conocido.
    }
  }

  Future<void> _abrirBandeja() async {
    await context.push('/notificaciones');
    if (mounted) _refrescarContador();
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final etiqueta = _noLeidas > 99 ? '99+' : '$_noLeidas';
    return IconButton(
      tooltip: _noLeidas > 0
          ? 'Notificaciones ($_noLeidas sin leer)'
          : 'Notificaciones',
      onPressed: _abrirBandeja,
      icon: Badge(
        isLabelVisible: _noLeidas > 0,
        backgroundColor: colores.rosePeligro,
        textColor: colores.sobreAcento,
        label: Text(etiqueta),
        child: const Icon(LucideIcons.bell),
      ),
    );
  }
}
