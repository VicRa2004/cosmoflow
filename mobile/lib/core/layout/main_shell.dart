import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../modules/auth/api/auth_api.dart';
import '../auth/sesion_store.dart';
import '../theme/colores_noche_indigo.dart';
import 'navegacion.dart';

/// Shell principal autenticado de Cosmoflow Mobile:
/// - Cajón lateral (`Drawer`) en azul noche (`lateral-*` de `DESIGN.md`).
/// - Barra superior con sección activa, cambio de tema y menú de usuario.
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
      drawer: _RailLateralNocheIndigo(
        ubicacionActual: ubicacionActual,
        sesionStore: sesionStore,
        authApi: authApi,
      ),
      body: child,
      bottomNavigationBar: itemsBarra.length >= 2
          ? Container(
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(color: colores.borde, width: 1),
                ),
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

class _RailLateralNocheIndigo extends StatelessWidget {
  const _RailLateralNocheIndigo({
    required this.ubicacionActual,
    required this.sesionStore,
    required this.authApi,
  });

  final String ubicacionActual;
  final SesionStore sesionStore;
  final AuthApi authApi;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final usuario = sesionStore.usuario;
    final inicial = (usuario != null && usuario.nombre.trim().isNotEmpty)
        ? usuario.nombre.trim()[0].toUpperCase()
        : 'U';

    return Drawer(
      backgroundColor: colores.lateral,
      shape: const RoundedRectangleBorder(),
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
              child: Row(
                children: <Widget>[
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: colores.indigoMarca,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    alignment: Alignment.center,
                    child: const Text(
                      'C',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    'Cosmoflow',
                    style: TextStyle(
                      color: colores.lateralTinta,
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            Divider(color: colores.lateralBorde, height: 1),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 12,
                ),
                children: <Widget>[
                  for (final grupo in gruposNavegacion) ...<Widget>[
                    Builder(
                      builder: (context) {
                        final visibles = obtenerItemsVisibles(
                          grupo.items,
                          sesionStore,
                        );
                        if (visibles.isEmpty) return const SizedBox.shrink();

                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: <Widget>[
                            Padding(
                              padding: const EdgeInsets.fromLTRB(8, 8, 8, 6),
                              child: Text(
                                grupo.titulo,
                                style: TextStyle(
                                  color: colores.lateralTenue,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                            for (final item in visibles)
                              _ItemRailLateral(
                                item: item,
                                isActivo: ubicacionActual.startsWith(item.ruta),
                                onTap: () {
                                  Navigator.of(context).pop();
                                  if (ubicacionActual != item.ruta) {
                                    context.go(item.ruta);
                                  }
                                },
                              ),
                            const SizedBox(height: 8),
                          ],
                        );
                      },
                    ),
                  ],
                ],
              ),
            ),
            Divider(color: colores.lateralBorde, height: 1),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: <Widget>[
                  CircleAvatar(
                    radius: 16,
                    backgroundColor: colores.lateralElevada,
                    child: Text(
                      inicial,
                      style: TextStyle(
                        color: colores.lateralSuave,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: <Widget>[
                        Text(
                          usuario?.nombre ?? 'Usuario',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: colores.lateralTinta,
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Text(
                          usuario?.email ?? '',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: colores.lateralTenue,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    tooltip: 'Cerrar sesión',
                    onPressed: () {
                      Navigator.of(context).pop();
                      authApi.logout();
                    },
                    icon: Icon(
                      Icons.logout_outlined,
                      size: 18,
                      color: colores.lateralSuave,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ItemRailLateral extends StatelessWidget {
  const _ItemRailLateral({
    required this.item,
    required this.isActivo,
    required this.onTap,
  });

  final ItemNavegacion item;
  final bool isActivo;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Material(
        color: isActivo ? colores.lateralElevada : Colors.transparent,
        borderRadius: BorderRadius.circular(6),
        child: InkWell(
          borderRadius: BorderRadius.circular(6),
          onTap: onTap,
          child: Container(
            height: 36,
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: Row(
              children: <Widget>[
                Icon(
                  item.icono,
                  size: 18,
                  color: isActivo
                      ? colores.lateralAcento
                      : colores.lateralTenue,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    item.etiqueta,
                    style: TextStyle(
                      color: isActivo
                          ? colores.lateralTinta
                          : colores.lateralSuave,
                      fontSize: 14,
                      fontWeight:
                          isActivo ? FontWeight.w500 : FontWeight.w400,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
