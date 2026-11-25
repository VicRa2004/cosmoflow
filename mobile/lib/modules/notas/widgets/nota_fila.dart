import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/tarjeta_seccion.dart';
import '../models/carpeta_model.dart';
import '../models/nota_model.dart';

/// Fila de nota estilo iOS/Notion: icono en caja, título Inter, pill de carpeta
/// (cuando se ven todas) y extracto limpio.
class NotaFila extends StatelessWidget {
  const NotaFila({
    super.key,
    required this.nota,
    required this.onTap,
    this.carpeta,
  });

  final NotaDto nota;
  final VoidCallback onTap;
  final CarpetaDto? carpeta;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final extracto = nota.contenido
        .trim()
        .replaceAll(RegExp(r'[#*_`>\[\]]+'), '')
        .replaceAll(RegExp(r'\s+'), ' ');

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            IconoCaja(
              icono: LucideIcons.fileText,
              color: colores.indigoMarca,
              fondo: colores.indigoSuave,
              dimension: 36,
              tamanoIcono: 18,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    nota.titulo,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  if (extracto.isNotEmpty) ...<Widget>[
                    const SizedBox(height: 3),
                    Text(
                      extracto,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: textTheme.bodySmall?.copyWith(
                        color: colores.tintaTenue,
                      ),
                    ),
                  ],
                  if (carpeta != null) ...<Widget>[
                    const SizedBox(height: 6),
                    InsigniaPill(
                      texto: carpeta!.nombre,
                      icono: LucideIcons.folder,
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 8),
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Icon(
                LucideIcons.chevronRight,
                size: 16,
                color: colores.tintaTenue,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
