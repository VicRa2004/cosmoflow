import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// Campo de fecha `AAAA-MM-DD` que abre `showDatePicker` con atajos rápidos; nunca se teclea a mano.
class CampoFecha extends StatelessWidget {
  const CampoFecha({
    super.key,
    required this.etiqueta,
    required this.controller,
    this.validator,
    this.mostrarAtajos = false,
  });

  final String etiqueta;
  final TextEditingController controller;
  final FormFieldValidator<String>? validator;
  final bool mostrarAtajos;

  static String aIso(DateTime fecha) =>
      '${fecha.year}-${fecha.month.toString().padLeft(2, '0')}-${fecha.day.toString().padLeft(2, '0')}';

  Future<void> _elegir(BuildContext context) async {
    final actual = DateTime.tryParse(controller.text) ?? DateTime.now();
    final elegida = await showDatePicker(
      context: context,
      initialDate: actual,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (elegida != null) controller.text = aIso(elegida);
  }

  void _aplicarDias(int dias) {
    final ahora = DateTime.now();
    final destino = DateTime(ahora.year, ahora.month, ahora.day + dias);
    controller.text = aIso(destino);
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<TextEditingValue>(
      valueListenable: controller,
      builder: (context, valor, _) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          TextFormField(
            controller: controller,
            readOnly: true,
            onTap: () => _elegir(context),
            validator: validator,
            decoration: InputDecoration(
              labelText: etiqueta,
              hintText: 'Sin fecha',
              prefixIcon: const Icon(LucideIcons.calendar, size: 18),
              suffixIcon: valor.text.isEmpty
                  ? null
                  : IconButton(
                      tooltip: 'Quitar fecha',
                      icon: const Icon(LucideIcons.x, size: 18),
                      onPressed: controller.clear,
                    ),
            ),
          ),
          if (mostrarAtajos) ...<Widget>[
            const SizedBox(height: 6),
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: <Widget>[
                ActionChip(
                  label: const Text('Hoy'),
                  onPressed: () => _aplicarDias(0),
                ),
                ActionChip(
                  label: const Text('Mañana'),
                  onPressed: () => _aplicarDias(1),
                ),
                ActionChip(
                  label: const Text('+7 días'),
                  onPressed: () => _aplicarDias(7),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
