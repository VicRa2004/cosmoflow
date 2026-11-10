import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../auth/sesion_store.dart';
import 'navegacion.dart';

/// Shell autenticado: solo la `NavigationBar` filtrada por permisos.
/// Cada página es dueña de su `Scaffold` (título, acciones y FAB).
class MainShell extends StatelessWidget {
  const MainShell({
    super.key,
    required this.ubicacionActual,
    required this.sesionStore,
    required this.child,
  });

  final String ubicacionActual;
  final SesionStore sesionStore;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final items = gruposNavegacion
        .expand((grupo) => obtenerItemsVisibles(grupo.items, sesionStore))
        .where((item) => item.enBarraInferior)
        .toList(growable: false);
    final indice = items.indexWhere(
      (item) => ubicacionActual.startsWith(item.ruta),
    );

    return Scaffold(
      body: child,
      bottomNavigationBar: items.length >= 2
          ? NavigationBar(
              selectedIndex: indice < 0 ? 0 : indice,
              onDestinationSelected: (i) {
                if (ubicacionActual != items[i].ruta) context.go(items[i].ruta);
              },
              destinations: <Widget>[
                for (final item in items)
                  NavigationDestination(
                    icon: Icon(item.icono),
                    selectedIcon: Icon(item.iconoActivo ?? item.icono),
                    label: item.etiqueta,
                  ),
              ],
            )
          : null,
    );
  }
}
