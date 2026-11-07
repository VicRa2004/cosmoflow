import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../core/auth/usuario_sesion.dart';

/// Cliente de API del módulo de Autenticación (`/api/auth/*`).
class AuthApi {
  const AuthApi({required this.apiClient});

  final ApiClient apiClient;

  /// Inicia sesión con email y contraseña (`POST /api/auth/login`).
  /// El `AuthInterceptor` guarda automáticamente la cookie `refresh_token`.
  Future<void> login({
    required String email,
    required String password,
  }) async {
    final response = await apiClient.dio.post<Map<String, dynamic>>(
      '/auth/login',
      data: <String, dynamic>{
        'email': email.trim(),
        'password': password,
      },
    );

    final data = response.data;
    if (data == null) {
      throw const FormatException('Respuesta vacía del servidor en login.');
    }

    final accessToken = data['accessToken'] as String;
    final usuarioJson = data['usuario'] as Map<String, dynamic>;

    apiClient.sesionStore.establecerSesion(
      accessToken: accessToken,
      usuario: UsuarioSesion.fromJson(usuarioJson),
    );
  }

  /// Restaura la sesión al abrir la app si existe un `refresh_token` guardado.
  Future<bool> restaurarSesion() {
    return apiClient.authInterceptor.intentarRefresh();
  }

  /// Cierra la sesión actual (`POST /api/auth/logout`) y limpia el almacenamiento seguro.
  Future<void> logout() async {
    try {
      await apiClient.dio.post<Map<String, dynamic>>('/auth/logout');
    } on DioException {
      // Incluso si la red falla, limpiamos el estado local.
    } finally {
      await apiClient.sesionStore.limpiarSesion();
    }
  }
}
