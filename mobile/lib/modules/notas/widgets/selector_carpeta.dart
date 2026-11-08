import 'package:flutter/material.dart';
import '../models/carpeta_model.dart';

/// Desplegable con las carpetas en árbol (sangría, icono). `null` = [textoNinguna].
class SelectorCarpeta extends StatelessWidget {
  const SelectorCarpeta({
    super.key,
    required this.carpetas,
    required this.valor,
    required this.onChanged,
    required this.textoNinguna,
  });

  final List<CarpetaDto> carpetas;
  final int? valor;
  final ValueChanged<int?> onChanged;

  /// «Todas las carpetas» al filtrar, «Sin carpeta» al asignar.
  final String textoNinguna;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<int?>(
      initialValue: valor,
      isExpanded: true,
      decoration: const InputDecoration(
        prefixIcon: Icon(Icons.folder_outlined, size: 18),
      ),
      items: <DropdownMenuItem<int?>>[
        DropdownMenuItem<int?>(child: Text(textoNinguna)),
        for (final (:carpeta, :nivel) in carpetasEnArbol(carpetas))
          DropdownMenuItem<int?>(
            value: carpeta.id,
            child: Text(
              '${'   ' * nivel}${carpeta.icono ?? '📁'} ${carpeta.nombre}',
              overflow: TextOverflow.ellipsis,
            ),
          ),
      ],
      onChanged: onChanged,
    );
  }
}
