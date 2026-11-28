import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/theme/tema_app.dart';
import '../../organizaciones/widgets/selector_color.dart';
import '../models/carpeta_model.dart';

/// Destino elegido en [mostrarMoverACarpetaSheet]. `carpetaId == null` significa la raíz.
typedef DestinoCarpeta = ({int? carpetaId});

/// Bottom sheet «Mover a…» para mover una nota o carpeta a otra carpeta (o a la raíz).
Future<DestinoCarpeta?> mostrarMoverACarpetaSheet(
  BuildContext context, {
  required String titulo,
  required List<CarpetaDto> carpetas,
  int? carpetaActualId,
  Set<int> excluirIds = const <int>{},
}) {
  final arbol = carpetasEnArbol(carpetas, excluirIds: excluirIds);
  return showModalBottomSheet<DestinoCarpeta>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    useSafeArea: true,
    builder: (ctx) {
      final colores = ctx.colores;
      final textTheme = Theme.of(ctx).textTheme;
      return ConstrainedBox(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.sizeOf(ctx).height * 0.7,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Padding(
              padding: const EdgeInsets.fromLTRB(
                TemaApp.margenPantalla,
                4,
                TemaApp.margenPantalla,
                12,
              ),
              child: Text(titulo, style: textTheme.titleLarge),
            ),
            const Divider(height: 1),
            Flexible(
              child: ListView(
                shrinkWrap: true,
                padding: const EdgeInsets.only(bottom: 24),
                children: <Widget>[
                  ListTile(
                    leading: Icon(
                      LucideIcons.folderRoot,
                      size: 20,
                      color: carpetaActualId == null
                          ? colores.indigoMarca
                          : colores.tintaSuave,
                    ),
                    title: const Text('Raíz (sin carpeta)'),
                    trailing: carpetaActualId == null
                        ? Icon(
                            LucideIcons.check,
                            size: 18,
                            color: colores.indigoMarca,
                          )
                        : null,
                    onTap: () => Navigator.of(ctx).pop((carpetaId: null)),
                  ),
                  for (final nodo in arbol)
                    ListTile(
                      contentPadding: EdgeInsets.only(
                        left: 16.0 + nodo.nivel * 20.0,
                        right: 16,
                      ),
                      leading: Icon(
                        LucideIcons.folder,
                        size: 20,
                        color:
                            parsearColorHex(nodo.carpeta.color) ??
                            (carpetaActualId == nodo.carpeta.id
                                ? colores.indigoMarca
                                : colores.tintaSuave),
                      ),
                      title: Text(
                        nodo.carpeta.nombre,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      trailing: carpetaActualId == nodo.carpeta.id
                          ? Icon(
                              LucideIcons.check,
                              size: 18,
                              color: colores.indigoMarca,
                            )
                          : null,
                      onTap: () =>
                          Navigator.of(ctx).pop((carpetaId: nodo.carpeta.id)),
                    ),
                ],
              ),
            ),
          ],
        ),
      );
    },
  );
}
