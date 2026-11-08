import 'dart:async';
import 'package:dio/dio.dart';
import '../auth/sesion_store.dart';
import '../auth/usuario_sesion.dart';

/// Interceptor de autenticación (Opción 1A):
/// - Inyecta `Authorization: Bearer <accessToken>` en las peticiones.
/// - Con `X-Client-Platform: mobile` el backend devuelve `refreshToken` en el cuerpo
///   (sin cookies): se guarda en `AlmacenamientoSeguro`.
/// - Adjunta `X-Refresh-Token` en `/auth/refresh` y `/auth/logout`.
/// - Serializa la renovación ante `401` (una sola petición `/auth/refresh` en vuelo).
class AuthInterceptor extends Interceptor {
  AuthInterceptor({
    required this.sesionStore,
    required this.dioPrincipal,
    Dio? dioRefresh,
  }) : _dioRefresh = dioRefresh ??
            Dio(
              BaseOptions(
                baseUrl: dioPrincipal.options.baseUrl,
                connectTimeout: dioPrincipal.options.connectTimeout,
                receiveTimeout: dioPrincipal.options.receiveTimeout,
                headers: <String, dynamic>{
                  'Content-Type': 'application/json',
                  'X-Client-Platform': 'mobile',
                },
              ),
            );

  final SesionStore sesionStore;
  final Dio dioPrincipal;
  final Dio _dioRefresh;

  Completer<bool>? _refreshEnCurso;

  /// Extrae `refreshToken` del cuerpo JSON de una respuesta de `/auth/*`.
  static String? extraerRefreshToken(Object? data) {
    if (data is! Map) return null;
    final token = data['refreshToken'];
    return token is String && token.isNotEmpty ? token : null;
  }

  bool _esRutaConRefreshToken(String path) {
    return path.endsWith('/auth/refresh') || path.endsWith('/auth/logout');
  }

  bool _esRutaDeAuthSinRetry(String path) {
    return path.contains('/auth/login') ||
        path.contains('/auth/registro') ||
        path.contains('/auth/refresh') ||
        path.contains('/auth/logout');
  }

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final accessToken = sesionStore.accessToken;
    if (accessToken != null && accessToken.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $accessToken';
    }

    if (_esRutaConRefreshToken(options.path)) {
      final refreshToken = await sesionStore.almacenamiento.leerRefreshToken();
      if (refreshToken != null && refreshToken.isNotEmpty) {
        options.headers['X-Refresh-Token'] = refreshToken;
      }
    }

    handler.next(options);
  }

  @override
  Future<void> onResponse(
    Response<dynamic> response,
    ResponseInterceptorHandler handler,
  ) async {
    await _guardarRefreshToken(response.data);
    handler.next(response);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final opcionesOriginales = err.requestOptions;
    final statusCode = err.response?.statusCode;
    final yaReintentado = opcionesOriginales.extra['_reintentado'] == true;

    if (statusCode != 401 ||
        yaReintentado ||
        _esRutaDeAuthSinRetry(opcionesOriginales.path) ||
        sesionStore.accessToken == null) {
      return handler.next(err);
    }

    final renovado = await _renovarSesionSerializada();
    if (!renovado) {
      await sesionStore.limpiarSesion();
      return handler.next(err);
    }

    try {
      opcionesOriginales.extra['_reintentado'] = true;
      opcionesOriginales.headers['Authorization'] =
          'Bearer ${sesionStore.accessToken}';
      final respuestaReintento = await dioPrincipal.fetch<dynamic>(
        opcionesOriginales,
      );
      return handler.resolve(respuestaReintento);
    } on DioException catch (errorReintento) {
      return handler.next(errorReintento);
    }
  }

  Future<void> _guardarRefreshToken(Object? data) async {
    final token = extraerRefreshToken(data);
    if (token != null) {
      await sesionStore.almacenamiento.guardarRefreshToken(token);
    }
  }

  /// Ejecuta una única llamada a `/auth/refresh` aunque lleguen múltiples 401 simultáneos.
  Future<bool> _renovarSesionSerializada() async {
    if (_refreshEnCurso != null) {
      return _refreshEnCurso!.future;
    }

    final completer = Completer<bool>();
    _refreshEnCurso = completer;

    try {
      final exito = await intentarRefresh();
      completer.complete(exito);
      return exito;
    } catch (_) {
      completer.complete(false);
      return false;
    } finally {
      _refreshEnCurso = null;
    }
  }

  /// Llama a `POST /auth/refresh` con el refresh token guardado y actualiza `SesionStore`.
  Future<bool> intentarRefresh() async {
    final refreshToken = await sesionStore.almacenamiento.leerRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) {
      return false;
    }

    try {
      final response = await _dioRefresh.post<Map<String, dynamic>>(
        '/auth/refresh',
        options: Options(
          headers: <String, dynamic>{
            'X-Refresh-Token': refreshToken,
          },
        ),
      );

      await _guardarRefreshToken(response.data);
      final data = response.data;
      if (data == null) return false;

      final nuevoAccessToken = data['accessToken'] as String?;
      final usuarioJson = data['usuario'] as Map<String, dynamic>?;
      if (nuevoAccessToken == null || usuarioJson == null) {
        return false;
      }

      sesionStore.establecerSesion(
        accessToken: nuevoAccessToken,
        usuario: UsuarioSesion.fromJson(usuarioJson),
      );
      return true;
    } on DioException {
      return false;
    }
  }
}
