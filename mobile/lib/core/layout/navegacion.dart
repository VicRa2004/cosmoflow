import 'package:flutter/material.dart';
import '../auth/sesion_store.dart';

/// Ítem declarativo de navegación (espejo de `frontend/src/core/components/layout/navegacion.ts`).
class ItemNavegacion {
  const ItemNavegacion({
    required this.ruta,
    required this.etiqueta,
    required this.icono,
    this.permiso,
    this.soloAdmin = false,
    this.enBarraInferior = false,
  });

  final String ruta;
  final String etiqueta;
  final IconData icono;
  final String? permiso;
  final bool soloAdmin;
  final bool enBarraInferior;
}

class GrupoNavegacion {
  const GrupoNavegacion({
    required this.titulo,
    required this.items,
  });

  final String titulo;
  final List<ItemNavegacion> items;
}

const List<GrupoNavegacion> gruposNavegacion = <GrupoNavegacion>[
  GrupoNavegacion(
    titulo: 'Personal',
    items: <ItemNavegacion>[
      ItemNavegacion(
        ruta: '/dashboard',
        etiqueta: 'Pendientes',
        icono: Icons.radio_button_checked_outlined,
        permiso: 'tareas:leer',
        enBarraInferior: true,
      ),
      ItemNavegacion(
        ruta: '/tareas',
        etiqueta: 'Tareas',
        icono: Icons.checklist_rounded,
        permiso: 'tareas:leer',
        enBarraInferior: true,
      ),
      ItemNavegacion(
        ruta: '/notas',
        etiqueta: 'Notas',
        icono: Icons.sticky_note_2_outlined,
        permiso: 'notas:leer',
        enBarraInferior: true,
      ),
      ItemNavegacion(
        ruta: '/tags',
        etiqueta: 'Tags',
        icono: Icons.sell_outlined,
        permiso: 'tags:leer',
        enBarraInferior: true,
      ),
      ItemNavegacion(
        ruta: '/perfil',
        etiqueta: 'Perfil',
        icono: Icons.person_outline_rounded,
        enBarraInferior: true,
      ),
    ],
  ),
];

/// Filtra los ítems visibles según los permisos efectivos y rol del usuario.
List<ItemNavegacion> obtenerItemsVisibles(
  List<ItemNavegacion> items,
  SesionStore sesionStore,
) {
  return items.where((item) {
    if (item.soloAdmin && !sesionStore.esAdmin) return false;
    return sesionStore.puede(item.permiso);
  }).toList(growable: false);
}
