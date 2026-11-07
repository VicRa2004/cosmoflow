import 'dart:async';
import 'package:dio/dio.dart';
import '../auth/sesion_store.dart';
import '../auth/usuario_sesion.dart';

/// Interceptor de autenticación (Opción 1A):
/// - Inyecta `Authorization: Bearer <accessToken>` en las peticiones.
/// - Captura la cookie `refresh_token` de las respuestas de `/auth/*` y la guarda en `AlmacenamientoSeguro`.
/// - Adjunta `Cookie: refresh_token=...` en `/auth/refresh` y `/auth/logout`.
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
                headers: <String, dynamic>{'Content-Type': 'application/json'},
              ),
            );

  final SesionStore sesionStore;
  final Dio dioPrincipal;
  final Dio _dioRefresh;

  Completer<bool>? _refreshEnCurso;

  static final RegExp _regexRefreshCookie =
      RegExp(r'(?:^|;\s*)refresh_token=([^;\s]*)');

  /// Extrae el valor de `refresh_token` de una lista de cabeceras `set-cookie`.
  static String? extraerRefreshTokenDeCookies(List<String>? setCookies) {
    if (setCookies == null || setCookies.isEmpty) return null;
    for (final header in setCookies) {
      final match = _regexRefreshCookie.firstMatch(header);
      if (match != null) {
        return match.group(1);
      }
    }
    return null;
  }

  bool _esRutaConCookieRefresh(String path) {
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

    if (_esRutaConCookieRefresh(options.path)) {
      final refreshToken = await sesionStore.almacenamiento.leerRefreshToken();
      if (refreshToken != null && refreshToken.isNotEmpty) {
        options.headers['Cookie'] = 'refresh_token=$refreshToken';
      }
    }

    handler.next(options);
  }

  @override
  Future<void> onResponse(
    Response<dynamic> response,
    ResponseInterceptorHandler handler,
  ) async {
    await _sincronizarCookieRefresh(response.headers);
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

  Future<void> _sincronizarCookieRefresh(Headers headers) async {
    final setCookies = headers['set-cookie'];
    final tokenExtraido = extraerRefreshTokenDeCookies(setCookies);
    if (tokenExtraido == null) return;

    if (tokenExtraido.isEmpty) {
      await sesionStore.almacenamiento.eliminarRefreshToken();
    } else {
      await sesionStore.almacenamiento.guardarRefreshToken(tokenExtraido);
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

  /// Llama a `POST /auth/refresh` enviando la cookie guardada y actualiza `SesionStore`.
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
            'Cookie': 'refresh_token=$refreshToken',
          },
        ),
      );

      await _sincronizarCookieRefresh(response.headers);
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
