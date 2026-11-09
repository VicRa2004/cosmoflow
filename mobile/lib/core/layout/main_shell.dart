import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../modules/auth/api/auth_api.dart';
import '../auth/sesion_store.dart';
import '../theme/colores_noche_indigo.dart';
import 'navegacion.dart';

/// Shell principal autenticado de Cosmoflow Mobile:
/// - Barra superior con sección activa, cambio de tema y cierre de sesión.
/// - Barra inferior (`NavigationBar`) filtrada por permisos efectivos.
class MainShell extends StatelessWidget {
  const MainShell({
    super.key,
    required this.ubicacionActual,
    required this.sesionStore,
    required this.authApi,
    required this.child,
  });

  final String ubicacionActual;
  final SesionStore sesionStore;
  final AuthApi authApi;
  final Widget child;

  List<ItemNavegacion> _obtenerTodosLosItemsVisibles() {
    final resultado = <ItemNavegacion>[];
    for (final grupo in gruposNavegacion) {
      resultado.addAll(obtenerItemsVisibles(grupo.items, sesionStore));
    }
    return resultado;
  }

  String _obtenerTituloSeccion(List<ItemNavegacion> items) {
    for (final item in items) {
      if (ubicacionActual.startsWith(item.ruta)) {
        return item.etiqueta;
      }
    }
    return 'Cosmoflow';
  }

  int _indiceActivo(List<ItemNavegacion> itemsBarra) {
    for (var i = 0; i < itemsBarra.length; i++) {
      if (ubicacionActual.startsWith(itemsBarra[i].ruta)) {
        return i;
      }
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final itemsVisibles = _obtenerTodosLosItemsVisibles();
    final itemsBarra = itemsVisibles
        .where((item) => item.enBarraInferior)
        .toList(growable: false);
    final titulo = _obtenerTituloSeccion(itemsVisibles);
    final indiceSeleccionado = _indiceActivo(itemsBarra);

    return Scaffold(
      appBar: AppBar(
        title: Text(titulo),
        actions: <Widget>[
          IconButton(
            tooltip: 'Cambiar tema',
            onPressed: () {
              final esOscuro = Theme.of(context).brightness == Brightness.dark;
              sesionStore.cambiarModoTema(
                esOscuro ? ThemeMode.light : ThemeMode.dark,
              );
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
      body: child,
      bottomNavigationBar: itemsBarra.length >= 2
          ? Container(
              decoration: BoxDecoration(
                border: Border(top: BorderSide(color: colores.borde, width: 1)),
              ),
              child: NavigationBar(
                height: 60,
                elevation: 0,
                backgroundColor: colores.superficie,
                indicatorColor: colores.elevada,
                selectedIndex: indiceSeleccionado,
                onDestinationSelected: (index) {
                  final destino = itemsBarra[index];
                  if (ubicacionActual != destino.ruta) {
                    context.go(destino.ruta);
                  }
                },
                destinations: itemsBarra
                    .map(
                      (item) => NavigationDestination(
                        icon: Icon(
                          item.icono,
                          size: 20,
                          color: colores.tintaTenue,
                        ),
                        selectedIcon: Icon(
                          item.icono,
                          size: 20,
                          color: colores.indigoMarca,
                        ),
                        label: item.etiqueta,
                      ),
                    )
                    .toList(growable: false),
              ),
            )
          : null,
    );
  }
}
