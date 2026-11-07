import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../core/auth/permisos_service.dart';
import '../../../core/auth/usuario_sesion.dart';

/// Cliente de API del módulo de Autenticación (`/api/auth/*`).
class AuthApi {
  AuthApi({
    required this.apiClient,
    PermisosService? permisosService,
  }) : _permisosService =
            permisosService ?? PermisosService(apiClient: apiClient);

  final ApiClient apiClient;
  final PermisosService _permisosService;

  /// Inicia sesión con email y contraseña (`POST /api/auth/login`).
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

    await _procesarRespuestaSesion(response.data);
  }

  /// Registra una nueva cuenta de usuario (`POST /api/auth/registro`).
  Future<void> registro({
    required String nombre,
    required String email,
    required String password,
  }) async {
    final response = await apiClient.dio.post<Map<String, dynamic>>(
      '/auth/registro',
      data: <String, dynamic>{
        'nombre': nombre.trim(),
        'email': email.trim(),
        'password': password,
      },
    );

    await _procesarRespuestaSesion(response.data);
  }

  /// Solicita el correo de recuperación de contraseña (`POST /api/auth/recuperar-password`).
  Future<String> recuperarPassword({required String email}) async {
    final response = await apiClient.dio.post<Map<String, dynamic>>(
      '/auth/recuperar-password',
      data: <String, dynamic>{'email': email.trim()},
    );

    final mensaje = response.data?['mensaje'] as String?;
    return mensaje ??
        'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.';
  }

  /// Restaura la sesión al abrir la app si existe un `refresh_token` guardado.
  Future<bool> restaurarSesion() async {
    final restaurada = await apiClient.authInterceptor.intentarRefresh();
    if (restaurada) {
      await _permisosService.cargarPermisosMios();
    }
    return restaurada;
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

  Future<void> _procesarRespuestaSesion(Map<String, dynamic>? data) async {
    if (data == null) {
      throw const FormatException('Respuesta vacía del servidor en auth.');
    }

    final accessToken = data['accessToken'] as String;
    final usuarioJson = data['usuario'] as Map<String, dynamic>;

    apiClient.sesionStore.establecerSesion(
      accessToken: accessToken,
      usuario: UsuarioSesion.fromJson(usuarioJson),
    );
    await _permisosService.cargarPermisosMios();
  }
}
