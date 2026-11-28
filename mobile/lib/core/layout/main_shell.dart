import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../modules/notificaciones/api/notificaciones_api.dart';
import '../../modules/notificaciones/preferencias_push_prompt.dart';
import '../auth/sesion_store.dart';
import '../push/push_service.dart';
import 'barra_navegacion_flotante.dart';
import 'navegacion.dart';

/// Shell autenticado: barra de navegación flotante filtrada por permisos y disparo
/// del aviso inicial para activar notificaciones solo por móvil.
/// Cada página es dueña de su `Scaffold` (título, acciones y FAB).
class MainShell extends StatefulWidget {
  const MainShell({
    super.key,
    required this.ubicacionActual,
    required this.sesionStore,
    required this.child,
    this.notificacionesApi,
    this.push,
    this.ofrecerPromptPush = false,
    this.onPreferenciasActualizadas,
  });

  final String ubicacionActual;
  final SesionStore sesionStore;
  final Widget child;
  final NotificacionesApi? notificacionesApi;
  final PushService? push;
  final bool ofrecerPromptPush;
  final VoidCallback? onPreferenciasActualizadas;

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  bool _comprobandoPrompt = false;

  @override
  void initState() {
    super.initState();
    widget.push?.onDispositivoRegistrado = _intentarOfrecerSoloMovil;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _intentarOfrecerSoloMovil();
    });
  }

  @override
  void dispose() {
    if (widget.push?.onDispositivoRegistrado == _intentarOfrecerSoloMovil) {
      widget.push?.onDispositivoRegistrado = null;
    }
    super.dispose();
  }

  Future<void> _intentarOfrecerSoloMovil() async {
    if (!mounted || _comprobandoPrompt || !widget.ofrecerPromptPush) return;
    final api = widget.notificacionesApi;
    final sesion = widget.sesionStore;
    final usuarioId = sesion.usuario?.id;
    if (api == null || usuarioId == null || sesion.sinConexion) return;

    _comprobandoPrompt = true;
    try {
      await ofrecerSoloMovilSiCorresponde(
        context: context,
        usuarioId: usuarioId,
        notificacionesApi: api,
        onPreferenciasActualizadas: widget.onPreferenciasActualizadas,
      );
    } finally {
      _comprobandoPrompt = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final items = gruposNavegacion
        .expand(
          (grupo) => obtenerItemsVisibles(grupo.items, widget.sesionStore),
        )
        .where((item) => item.enBarraInferior)
        .toList(growable: false);
    final indice = items.indexWhere(
      (item) => widget.ubicacionActual.startsWith(item.ruta),
    );

    return Scaffold(
      body: widget.child,
      bottomNavigationBar: items.length >= 2
          ? BarraNavegacionFlotante(
              items: items,
              indiceActivo: indice < 0 ? 0 : indice,
              usuario: widget.sesionStore.usuario,
              onSeleccionar: (i) {
                if (widget.ubicacionActual != items[i].ruta) {
                  context.go(items[i].ruta);
                }
              },
            )
          : null,
    );
  }
}
