import 'dart:typed_data';

import 'package:dio/dio.dart';

import '../../../core/api/api_client.dart';
import '../../../core/auth/usuario_sesion.dart';
import '../models/perfil_models.dart';

/// Cliente de API para avatar, sesiones activas, 2FA, suscripción iCalendar y baja de cuenta.
class PerfilApi {
  const PerfilApi({required this.apiClient});

  final ApiClient apiClient;

  /// Sube una nueva foto de perfil (`PUT /api/avatares`, campo `archivo`, máx. 2 MB).
  Future<UsuarioSesion> subirAvatar({
    required Uint8List bytes,
    required String nombreArchivo,
  }) async {
    final formData = FormData.fromMap(<String, dynamic>{
      'archivo': MultipartFile.fromBytes(bytes, filename: nombreArchivo),
    });
    final response = await apiClient.dio.put<Map<String, dynamic>>(
      '/avatares',
      data: formData,
    );
    return UsuarioSesion.fromJson(response.data!);
  }

  /// Quita la foto de perfil actual (`DELETE /api/avatares`).
  Future<UsuarioSesion> eliminarAvatar() async {
    final response = await apiClient.dio.delete<Map<String, dynamic>>(
      '/avatares',
    );
    return UsuarioSesion.fromJson(response.data!);
  }

  /// Lista las sesiones activas de la cuenta (`GET /api/auth/sesiones`).
  Future<List<SesionActivaDto>> obtenerSesiones() async {
    final response = await apiClient.dio.get<List<dynamic>>('/auth/sesiones');
    return (response.data ?? const <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .map(SesionActivaDto.fromJson)
        .toList(growable: false);
  }

  /// Cierra una sesión específica por ID (`DELETE /api/auth/sesiones/{id}`).
  Future<void> cerrarSesion(int id) async {
    await apiClient.dio.delete<void>('/auth/sesiones/$id');
  }

  /// Estado actual de la verificación en dos pasos (`GET /api/auth/dos-pasos`).
  Future<EstadoDosPasosDto> estadoDosPasos() async {
    final response = await apiClient.dio.get<Map<String, dynamic>>(
      '/auth/dos-pasos',
    );
    return EstadoDosPasosDto.fromJson(
      response.data ?? const <String, dynamic>{},
    );
  }

  /// Genera secreto y URI `otpauth://` para activar 2FA (`POST /api/auth/dos-pasos/iniciar`).
  Future<InicioDosPasosDto> iniciarDosPasos() async {
    final response = await apiClient.dio.post<Map<String, dynamic>>(
      '/auth/dos-pasos/iniciar',
    );
    return InicioDosPasosDto.fromJson(response.data!);
  }

  /// Confirma la activación de 2FA con un código de 6 dígitos (`POST /api/auth/dos-pasos/activar`).
  Future<List<String>> activarDosPasos(String codigo) async {
    final response = await apiClient.dio.post<Map<String, dynamic>>(
      '/auth/dos-pasos/activar',
      data: <String, dynamic>{'codigo': codigo.trim()},
    );
    final raw = response.data?['codigosRecuperacion'];
    return raw is List
        ? raw.whereType<String>().toList(growable: false)
        : const <String>[];
  }

  /// Desactiva 2FA pidiendo contraseña o código (`POST /api/auth/dos-pasos/desactivar`).
  Future<void> desactivarDosPasos({String? password, String? codigo}) async {
    await apiClient.dio.post<void>(
      '/auth/dos-pasos/desactivar',
      data: <String, dynamic>{
        if (password != null && password.isNotEmpty) 'password': password,
        if (codigo != null && codigo.trim().isNotEmpty) 'codigo': codigo.trim(),
      },
    );
  }

  /// Estado de la suscripción iCalendar (`GET /api/calendario/suscripcion`).
  Future<SuscripcionCalendarioDto> estadoCalendario() async {
    final response = await apiClient.dio.get<Map<String, dynamic>>(
      '/calendario/suscripcion',
    );
    return SuscripcionCalendarioDto.fromJson(
      response.data ?? const <String, dynamic>{},
    );
  }

  /// Genera o regenera la URL iCalendar (`POST /api/calendario/suscripcion`).
  Future<String> generarCalendario() async {
    final response = await apiClient.dio.post<Map<String, dynamic>>(
      '/calendario/suscripcion',
    );
    return response.data?['url'] as String? ?? '';
  }

  /// Desactiva la URL iCalendar (`DELETE /api/calendario/suscripcion`).
  Future<void> desactivarCalendario() async {
    await apiClient.dio.delete<void>('/calendario/suscripcion');
  }

  /// Elimina permanentemente la cuenta (`DELETE /api/cuenta`).
  Future<void> eliminarCuenta(String password) async {
    await apiClient.dio.delete<void>(
      '/cuenta',
      data: <String, dynamic>{'password': password},
    );
  }
}
