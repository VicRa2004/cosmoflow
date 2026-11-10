import 'package:flutter/material.dart';

/// Ejecuta una acción remota y avisa con un `SnackBar` si falla. Devuelve si tuvo éxito.
Future<bool> ejecutarConAviso(
  BuildContext context,
  Future<void> Function() accion, {
  required String error,
  String? exito,
}) async {
  final mensajero = ScaffoldMessenger.of(context);
  try {
    await accion();
    if (exito != null) mensajero.showSnackBar(SnackBar(content: Text(exito)));
    return true;
  } catch (_) {
    mensajero.showSnackBar(SnackBar(content: Text(error)));
    return false;
  }
}
