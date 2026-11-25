import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

/// Extrae el mensaje `error` devuelto por el backend si el fallo es un [DioException].
String? mensajeErrorServidor(Object error) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final mensaje = data['error'];
      if (mensaje is String && mensaje.trim().isNotEmpty) {
        return mensaje.trim();
      }
    }
  }
  return null;
}

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
  } catch (e) {
    final detalle = mensajeErrorServidor(e) ?? error;
    mensajero.showSnackBar(SnackBar(content: Text(detalle)));
    return false;
  }
}
