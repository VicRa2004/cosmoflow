import 'package:flutter/material.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../models/carpeta_model.dart';
import '../models/nota_model.dart';

/// Tarjeta de la lista: título, carpeta (si se ven todas) y extracto.
class NotaCard extends StatelessWidget {
  const NotaCard({
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
    final carpeta = this.carpeta;
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                nota.titulo,
                style: textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w500,
                ),
              ),
              if (carpeta != null) ...<Widget>[
                const SizedBox(height: 4),
                Text(
                  '${carpeta.icono ?? '📁'} ${carpeta.nombre}',
                  style: textTheme.bodySmall?.copyWith(
                    color: colores.tintaSuave,
                  ),
                ),
              ],
              if (nota.contenido.trim().isNotEmpty) ...<Widget>[
                const SizedBox(height: 6),
                Text(
                  nota.contenido.trim(),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: textTheme.bodySmall?.copyWith(
                    color: colores.tintaTenue,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
