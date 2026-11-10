import 'package:flutter/material.dart';
import '../theme/colores_noche_indigo.dart';

/// Diálogo de confirmación. Devuelve `true` solo si el usuario acepta.
Future<bool> confirmar(
  BuildContext context, {
  required String titulo,
  required String mensaje,
  required String accion,
  bool destructiva = true,
}) async {
  final colores = context.colores;
  final resultado = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(titulo),
      content: Text(mensaje),
      actions: <Widget>[
        TextButton(
          onPressed: () => Navigator.of(ctx).pop(false),
          child: const Text('Cancelar'),
        ),
        TextButton(
          onPressed: () => Navigator.of(ctx).pop(true),
          style: destructiva
              ? TextButton.styleFrom(foregroundColor: colores.rosePeligro)
              : null,
          child: Text(accion),
        ),
      ],
    ),
  );
  return resultado ?? false;
}
