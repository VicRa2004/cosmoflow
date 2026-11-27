import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/theme/colores_noche_indigo.dart';

/// Colores de acento compartidos para organizaciones, equipos y proyectos.
const List<String> coloresAcentoOrganizacion = <String>[
  '#6366f1',
  '#4F46E5',
  '#E11D48',
  '#059669',
  '#D97706',
  '#0284C7',
  '#7C3AED',
  '#0D9488',
];

/// Parsea un color hexadecimal `#RRGGBB` (o `null` si no es válido).
Color? parsearColorHex(String? hex) {
  if (hex == null || hex.isEmpty) return null;
  final limpio = hex.replaceFirst('#', '');
  if (limpio.length != 6) return null;
  final valor = int.tryParse('FF$limpio', radix: 16);
  return valor != null ? Color(valor) : null;
}

/// Selector de color de acento con opción opcional de «Sin color».
class SelectorColor extends StatelessWidget {
  const SelectorColor({
    super.key,
    required this.valor,
    required this.onChanged,
    this.opcional = false,
  });

  final String? valor;
  final ValueChanged<String?> onChanged;
  final bool opcional;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final actual = valor?.toLowerCase();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text('Color', style: textTheme.labelLarge),
        const SizedBox(height: 6),
        Wrap(
          spacing: 4,
          runSpacing: 4,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: <Widget>[
            if (opcional)
              ChoiceChip(
                label: const Text('Sin color'),
                selected: actual == null || actual.isEmpty,
                onSelected: (_) => onChanged(null),
              ),
            for (final hex in coloresAcentoOrganizacion)
              IconButton(
                onPressed: () => onChanged(hex),
                icon: Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: parsearColorHex(hex),
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: actual == hex.toLowerCase()
                      ? Icon(
                          LucideIcons.check,
                          color: context.colores.sobreAcento,
                          size: 16,
                        )
                      : null,
                ),
              ),
          ],
        ),
      ],
    );
  }
}
