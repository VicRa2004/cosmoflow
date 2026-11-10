import 'package:flutter/material.dart';
import '../../../core/theme/colores_noche_indigo.dart';
import '../../tags/models/tag_model.dart';
import '../models/nota_model.dart';

/// Hoja de lectura de una nota siguiendo `DialogoLectura` de `DESIGN.md`.
class NotaDetalleSheet extends StatelessWidget {
  const NotaDetalleSheet({
    super.key,
    required this.nota,
    this.tagsDisponibles = const <TagDto>[],
    this.onEditar,
    this.onEliminar,
    this.puedeActualizar = true,
    this.puedeEliminar = true,
  });

  final NotaDto nota;
  final List<TagDto> tagsDisponibles;
  final VoidCallback? onEditar;
  final VoidCallback? onEliminar;
  final bool puedeActualizar;
  final bool puedeEliminar;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final tagsDeNota = tagsDisponibles
        .where((t) => nota.tagIds.contains(t.id))
        .toList(growable: false);

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Text(nota.titulo, style: textTheme.titleMedium),
            if (tagsDeNota.isNotEmpty) ...<Widget>[
              const SizedBox(height: 12),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: <Widget>[
                  for (final tag in tagsDeNota)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: colores.elevada,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: colores.borde, width: 1),
                      ),
                      child: Text(tag.nombre, style: textTheme.labelMedium),
                    ),
                ],
              ),
            ],
            const SizedBox(height: 16),
            Divider(color: colores.borde, height: 1),
            const SizedBox(height: 16),
            Flexible(
              child: SingleChildScrollView(
                child: Text(
                  nota.contenido.trim().isNotEmpty
                      ? nota.contenido
                      : 'Sin contenido.',
                  style: textTheme.bodyMedium?.copyWith(
                    color: nota.contenido.trim().isNotEmpty
                        ? colores.tinta
                        : colores.tintaTenue,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Divider(color: colores.borde, height: 1),
            const SizedBox(height: 12),
            Wrap(
              alignment: WrapAlignment.spaceBetween,
              crossAxisAlignment: WrapCrossAlignment.center,
              spacing: 8,
              runSpacing: 8,
              children: <Widget>[
                if (puedeEliminar && onEliminar != null)
                  TextButton.icon(
                    onPressed: onEliminar,
                    icon: Icon(
                      Icons.delete_outline_rounded,
                      color: colores.rosePeligro,
                    ),
                    label: Text(
                      'Eliminar',
                      style: TextStyle(color: colores.rosePeligro),
                    ),
                  )
                else
                  const SizedBox.shrink(),
                if (puedeActualizar && onEditar != null)
                  FilledButton.icon(
                    onPressed: onEditar,
                    icon: const Icon(Icons.edit_outlined),
                    label: const Text('Editar'),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
