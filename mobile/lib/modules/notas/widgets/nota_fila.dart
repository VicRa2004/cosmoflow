import 'package:flutter/material.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../models/carpeta_model.dart';
import '../models/nota_model.dart';

/// Fila de lista: título, carpeta (si se ven todas) y extracto de una línea.
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
    final extracto = nota.contenido.trim().replaceAll(RegExp(r'\s+'), ' ');
    final meta = <String>[
      if (carpeta != null) carpeta!.nombre,
      if (extracto.isNotEmpty) extracto,
    ].join(' · ');
    return ListTile(
      onTap: onTap,
      leading: Icon(Icons.sticky_note_2_outlined, color: colores.tintaTenue),
      title: Text(nota.titulo, maxLines: 1, overflow: TextOverflow.ellipsis),
      subtitle: meta.isEmpty
          ? null
          : Text(
              meta,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: colores.tintaTenue),
            ),
    );
  }
}
