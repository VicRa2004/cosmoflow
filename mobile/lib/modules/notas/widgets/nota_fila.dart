import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/widgets/tarjeta_seccion.dart';
import '../../tags/models/tag_model.dart';
import '../models/carpeta_model.dart';
import '../models/nota_model.dart';

enum AccionNota { fijar, mover, duplicar, eliminar }

/// Fila de nota estilo Obsidian iOS: indentable dentro de carpetas expandidas,
/// fecha del día de creación (sin hora), extracto limpio y menú contextual.
class NotaFila extends StatelessWidget {
  const NotaFila({
    super.key,
    required this.nota,
    required this.onTap,
    this.carpeta,
    this.tags = const <TagDto>[],
    this.nivelIndentacion = 0,
    this.onAccion,
    this.puedeEditar = false,
    this.puedeCrear = false,
    this.puedeEliminar = false,
  });

  final NotaDto nota;
  final VoidCallback onTap;
  final CarpetaDto? carpeta;
  final List<TagDto> tags;
  final int nivelIndentacion;
  final ValueChanged<AccionNota>? onAccion;
  final bool puedeEditar;
  final bool puedeCrear;
  final bool puedeEliminar;

  String? _fechaCreacion(DateTime? fecha) {
    if (fecha == null) return null;
    final local = fecha.toLocal();
    const meses = <String>[
      'ene',
      'feb',
      'mar',
      'abr',
      'may',
      'jun',
      'jul',
      'ago',
      'sep',
      'oct',
      'nov',
      'dic',
    ];
    final mes = meses[local.month - 1];
    return '${local.day} $mes ${local.year}';
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final extracto = nota.contenido
        .trim()
        .replaceAll(RegExp(r'[#*_`>\[\]]+'), '')
        .replaceAll(RegExp(r'\s+'), ' ');
    final fechaTexto = _fechaCreacion(nota.createdAt ?? nota.updatedAt);
    final tieneMenu =
        onAccion != null && (puedeEditar || puedeCrear || puedeEliminar);
    final tagsNota = tags
        .where((t) => nota.tagIds.contains(t.id))
        .take(3)
        .toList(growable: false);
    final sangria = 16.0 + (nivelIndentacion * 20.0);

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: EdgeInsets.fromLTRB(sangria, 11, tieneMenu ? 4 : 16, 11),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: <Widget>[
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Row(
                    children: <Widget>[
                      if (nota.isFijada) ...<Widget>[
                        Icon(
                          LucideIcons.pin,
                          size: 13,
                          color: colores.amberAviso,
                        ),
                        const SizedBox(width: 6),
                      ],
                      Expanded(
                        child: Text(
                          nota.titulo,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: textTheme.bodyLarge?.copyWith(
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (fechaTexto != null || extracto.isNotEmpty) ...<Widget>[
                    const SizedBox(height: 3),
                    Row(
                      children: <Widget>[
                        if (fechaTexto != null) ...<Widget>[
                          Text(
                            fechaTexto,
                            style: textTheme.bodySmall?.copyWith(
                              color: colores.tintaSuave,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          if (extracto.isNotEmpty)
                            Text(
                              '  ·  ',
                              style: textTheme.bodySmall?.copyWith(
                                color: colores.tintaTenue,
                              ),
                            ),
                        ],
                        if (extracto.isNotEmpty)
                          Expanded(
                            child: Text(
                              extracto,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: textTheme.bodySmall?.copyWith(
                                color: colores.tintaTenue,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                  if (carpeta != null || tagsNota.isNotEmpty) ...<Widget>[
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      children: <Widget>[
                        if (carpeta != null)
                          InsigniaPill(
                            texto: carpeta!.nombre,
                            icono: LucideIcons.folder,
                          ),
                        for (final tag in tagsNota)
                          InsigniaPill(
                            texto: '#${tag.nombre}',
                            colorTexto: colores.indigoMarca,
                            colorFondo: colores.indigoSuave,
                          ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            if (tieneMenu)
              PopupMenuButton<AccionNota>(
                icon: Icon(
                  LucideIcons.ellipsisVertical,
                  size: 17,
                  color: colores.tintaTenue,
                ),
                onSelected: onAccion,
                itemBuilder: (_) => <PopupMenuEntry<AccionNota>>[
                  if (puedeEditar)
                    PopupMenuItem<AccionNota>(
                      value: AccionNota.fijar,
                      child: Text(nota.isFijada ? 'Desfijar' : 'Fijar'),
                    ),
                  if (puedeEditar)
                    const PopupMenuItem<AccionNota>(
                      value: AccionNota.mover,
                      child: Text('Mover a…'),
                    ),
                  if (puedeCrear)
                    const PopupMenuItem<AccionNota>(
                      value: AccionNota.duplicar,
                      child: Text('Duplicar'),
                    ),
                  if (puedeEliminar)
                    PopupMenuItem<AccionNota>(
                      value: AccionNota.eliminar,
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
