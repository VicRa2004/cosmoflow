import 'package:flutter/material.dart';

/// Campo de fecha `AAAA-MM-DD` que abre `showDatePicker`; nunca se teclea a mano.
class CampoFecha extends StatelessWidget {
  const CampoFecha({
    super.key,
    required this.etiqueta,
    required this.controller,
    this.validator,
  });

  final String etiqueta;
  final TextEditingController controller;
  final FormFieldValidator<String>? validator;

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

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<TextEditingValue>(
      valueListenable: controller,
      builder: (context, valor, _) => TextFormField(
        controller: controller,
        readOnly: true,
        onTap: () => _elegir(context),
        validator: validator,
        decoration: InputDecoration(
          labelText: etiqueta,
          hintText: 'Sin fecha',
          prefixIcon: const Icon(Icons.event_outlined),
          suffixIcon: valor.text.isEmpty
              ? null
              : IconButton(
                  tooltip: 'Quitar fecha',
                  icon: const Icon(Icons.close_rounded),
                  onPressed: controller.clear,
                ),
        ),
      ),
    );
  }
}
