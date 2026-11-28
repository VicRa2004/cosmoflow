import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../organizaciones/widgets/selector_color.dart';
import '../models/carpeta_model.dart';

enum AccionCarpeta { nuevaNota, nuevaSubcarpeta, editar, mover, eliminar }

/// Fila de carpeta desplegable estilo Obsidian iOS: al pulsar despliega
/// subcarpetas y notas justo debajo con flecha animada (`›` ↔ `⌄`).
class CarpetaFila extends StatelessWidget {
  const CarpetaFila({
    super.key,
    required this.carpeta,
    required this.expandida,
    required this.onTap,
    this.nivelIndentacion = 0,
    this.cantidadElementos = 0,
    this.onAccion,
    this.puedeCrear = false,
    this.puedeEditar = false,
    this.puedeEliminar = false,
  });

  final CarpetaDto carpeta;
  final bool expandida;
  final VoidCallback onTap;
  final int nivelIndentacion;
  final int cantidadElementos;
  final ValueChanged<AccionCarpeta>? onAccion;
  final bool puedeCrear;
  final bool puedeEditar;
  final bool puedeEliminar;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final colorPersonal = parsearColorHex(carpeta.color);
    final sangria = 16.0 + (nivelIndentacion * 20.0);
    final tieneMenu =
        onAccion != null && (puedeCrear || puedeEditar || puedeEliminar);

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: EdgeInsets.fromLTRB(sangria, 12, tieneMenu ? 4 : 16, 12),
        child: Row(
          children: <Widget>[
            if (colorPersonal != null) ...<Widget>[
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: colorPersonal,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 10),
            ],
            Expanded(
              child: Text(
                carpeta.nombre,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: textTheme.bodyLarge?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            if (cantidadElementos > 0) ...<Widget>[
              Text(
                '$cantidadElementos',
                style: textTheme.bodySmall?.copyWith(
                  color: colores.tintaTenue,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(width: 6),
            ],
            AnimatedRotation(
              turns: expandida ? 0.25 : 0.0,
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeOutCubic,
              child: Icon(
                LucideIcons.chevronRight,
                size: 16,
                color: colores.tintaTenue,
              ),
            ),
            if (tieneMenu)
              PopupMenuButton<AccionCarpeta>(
                icon: Icon(
                  LucideIcons.ellipsisVertical,
                  size: 17,
                  color: colores.tintaTenue,
                ),
                onSelected: onAccion,
                itemBuilder: (_) => <PopupMenuEntry<AccionCarpeta>>[
                  if (puedeCrear)
                    const PopupMenuItem<AccionCarpeta>(
                      value: AccionCarpeta.nuevaNota,
                      child: Text('Nueva nota aquí'),
                    ),
                  if (puedeCrear)
                    const PopupMenuItem<AccionCarpeta>(
                      value: AccionCarpeta.nuevaSubcarpeta,
                      child: Text('Nueva subcarpeta'),
                    ),
                  if (puedeEditar)
                    const PopupMenuItem<AccionCarpeta>(
                      value: AccionCarpeta.editar,
                      child: Text('Editar carpeta'),
                    ),
                  if (puedeEditar)
                    const PopupMenuItem<AccionCarpeta>(
                      value: AccionCarpeta.mover,
                      child: Text('Mover a…'),
                    ),
                  if (puedeEliminar)
                    PopupMenuItem<AccionCarpeta>(
                      value: AccionCarpeta.eliminar,
                      child: Text(
                        'Eliminar',
                        style: TextStyle(color: colores.rosePeligro),
                      ),
                    ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}
