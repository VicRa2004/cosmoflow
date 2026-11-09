import 'dart:convert';

import 'package:dio/dio.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/auth_interceptor.dart';
import '../../../core/auth/permisos_service.dart';
import '../../../core/auth/usuario_sesion.dart';

/// Excepción controlada durante el flujo de OAuth con Google.
class OAuthGoogleException implements Exception {
  const OAuthGoogleException(this.mensaje);

  final String mensaje;

  @override
  String toString() => mensaje;
}

/// Datos iniciales para abrir la pantalla de autorización de Google (`GET /api/auth/google`).
class InicioOAuthGoogle {
  const InicioOAuthGoogle({
    required this.urlAutorizacion,
    required this.cookieOAuth,
  });

  final String urlAutorizacion;
  final String cookieOAuth;
}

/// Cliente de API del módulo de Autenticación (`/api/auth/*`).
class AuthApi {
  AuthApi({required this.apiClient, PermisosService? permisosService})
    : _permisosService =
          permisosService ?? PermisosService(apiClient: apiClient);

  final ApiClient apiClient;
  final PermisosService _permisosService;

  /// Inicia sesión con email y contraseña (`POST /api/auth/login`).
  Future<void> login({required String email, required String password}) async {
    final response = await apiClient.dio.post<Map<String, dynamic>>(
      '/auth/login',
      data: <String, dynamic>{'email': email.trim(), 'password': password},
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

  /// Obtiene la URL de autorización de Google y la cookie `google_oauth` (`GET /api/auth/google`).
  Future<InicioOAuthGoogle> iniciarOAuthGoogle() async {
    final response = await apiClient.dio.get<dynamic>(
      '/auth/google',
      options: Options(
        followRedirects: false,
        validateStatus: (status) =>
            status != null && status >= 200 && status < 400,
      ),
    );

    final location = response.headers.value('location');
    final cookieOAuth = AuthInterceptor.extraerValorCookie(
      response.headers['set-cookie'],
      'google_oauth',
    );

    if (location == null ||
        location.isEmpty ||
        location.contains('error=google') ||
        cookieOAuth == null ||
        cookieOAuth.isEmpty) {
      throw const OAuthGoogleException(
        'El inicio de sesión con Google no está disponible en este momento.',
      );
    }

    return InicioOAuthGoogle(
      urlAutorizacion: location,
      cookieOAuth: cookieOAuth,
    );
  }

  /// Completa el flujo OAuth con Google (`GET /api/auth/google/callback`), guarda el
  /// `refresh_token` emitido y lo canjea por la sesión activa (`POST /api/auth/refresh`).
  Future<void> completarOAuthGoogle({
    required String code,
    required String state,
    required String cookieOAuth,
  }) async {
    final response = await apiClient.dio.get<dynamic>(
      '/auth/google/callback',
      queryParameters: <String, dynamic>{'code': code, 'state': state},
      options: Options(
        followRedirects: false,
        validateStatus: (status) =>
            status != null && status >= 200 && status < 400,
        headers: <String, dynamic>{'Cookie': 'google_oauth=$cookieOAuth'},
      ),
    );

    final location = response.headers.value('location') ?? '';
    final refreshToken = AuthInterceptor.extraerValorCookie(
      response.headers['set-cookie'],
      'refresh_token',
    );

    if (location.contains('error=google') ||
        refreshToken == null ||
        refreshToken.isEmpty) {
      throw const OAuthGoogleException(
        'No se pudo iniciar sesión con Google. Inténtalo de nuevo.',
      );
    }

    await apiClient.sesionStore.almacenamiento.guardarRefreshToken(
      refreshToken,
    );

    final restaurada = await restaurarSesion();
    if (!restaurada) {
      throw const OAuthGoogleException(
        'No se pudo establecer la sesión con Google. Inténtalo de nuevo.',
      );
    }
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

  /// Cambia la contraseña actual (`PUT /api/auth/password`).
  /// El backend emite un nuevo `accessToken` + `refreshToken` (lo guarda `AuthInterceptor`) y revoca el resto de sesiones.
  Future<void> cambiarPassword({
    required String passwordActual,
    required String passwordNueva,
  }) async {
    final response = await apiClient.dio.put<Map<String, dynamic>>(
      '/auth/password',
      data: <String, dynamic>{
        'passwordActual': passwordActual,
        'passwordNueva': passwordNueva,
      },
    );

    final nuevoToken = response.data?['accessToken'] as String?;
    if (nuevoToken != null && nuevoToken.isNotEmpty) {
      apiClient.sesionStore.actualizarAccessToken(nuevoToken);
    }
  }

  /// Reenvía el correo de verificación de email (`POST /api/auth/verificar-email/reenviar`).
  Future<String> reenviarVerificacionEmail() async {
    final response = await apiClient.dio.post<Map<String, dynamic>>(
      '/auth/verificar-email/reenviar',
    );
    return response.data?['mensaje'] as String? ??
        'Correo de verificación enviado.';
  }

  /// Cierra todas las sesiones activas de la cuenta (`POST /api/auth/logout-todas`).
  Future<void> cerrarTodasLasSesiones() async {
    try {
      await apiClient.dio.post<Map<String, dynamic>>('/auth/logout-todas');
    } on DioException {
      // Aunque falle la red, limpiamos la sesión local.
    } finally {
      await apiClient.sesionStore.limpiarSesion();
    }
  }

  /// Restaura la sesión al abrir la app si existe un refresh token guardado.
  Future<bool> restaurarSesion() async {
    final restaurada = await apiClient.authInterceptor.intentarRefresh();
    if (restaurada == true) {
      await _permisosService.cargarPermisosMios();
      return true;
    }
    // Sin red: entra con el último usuario para crear notas y tareas sin conexión.
    final sesion = apiClient.sesionStore;
    final usuario = await sesion.almacenamiento.leerUsuario();
    if (restaurada == null && usuario != null && !sesion.isAutenticado) {
      sesion.entrarSinConexion(
        UsuarioSesion.fromJson(jsonDecode(usuario) as Map<String, dynamic>),
      );
    }
    return false;
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
