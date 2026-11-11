import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api/auth_api.dart';

/// Servicio encargado del flujo OAuth con Google utilizando el navegador
/// externo del dispositivo (Chrome, Safari, etc.) y deep linking (`cosmoflow://login-callback`).
class OAuthGoogleService {
  OAuthGoogleService({AppLinks? appLinks}) : _appLinks = appLinks ?? AppLinks();

  final AppLinks _appLinks;
  StreamSubscription<Uri>? _suscripcionLinks;

  /// Inicia el listener global de enlaces profundos para procesar callbacks en frío o en segundo plano.
  void iniciarListenerGlobal({required AuthApi authApi}) {
    _suscripcionLinks?.cancel();
    _suscripcionLinks = _appLinks.uriLinkStream.listen((uri) {
      procesarDeepLink(uri: uri, authApi: authApi);
    });

    _appLinks.getInitialLink().then((uri) {
      if (uri != null) {
        procesarDeepLink(uri: uri, authApi: authApi);
      }
    });
  }

  /// Procesa una URI entrante del esquema `cosmoflow://login-callback`.
  /// Devuelve `true` si la URI era un callback de Google y se procesó.
  Future<bool> procesarDeepLink({
    required Uri uri,
    required AuthApi authApi,
  }) async {
    if (uri.scheme != 'cosmoflow' || uri.host != 'login-callback') {
      return false;
    }

    final error = uri.queryParameters['error'];
    if (error != null && error.isNotEmpty) {
      return false;
    }

    final refreshToken = uri.queryParameters['refreshToken'];
    if (refreshToken == null || refreshToken.isEmpty) {
      return false;
    }

    await authApi.apiClient.sesionStore.almacenamiento.guardarRefreshToken(
      refreshToken,
    );
    await authApi.restaurarSesion();
    return true;
  }

  /// Inicia la autenticación con Google abriendo el navegador del dispositivo.
  /// Escucha el retorno mediante deep link (`cosmoflow://login-callback`) y canjea la sesión.
  Future<bool> autenticar({
    required AuthApi authApi,
    Duration timeout = const Duration(minutes: 5),
  }) async {
    final completer = Completer<bool>();
    StreamSubscription<Uri>? subLocal;

    final urlAutorizacion = Uri.parse(
      '${authApi.apiClient.baseUrl}/auth/google?movil=1',
    );

    subLocal = _appLinks.uriLinkStream.listen(
      (uri) async {
        if (uri.scheme == 'cosmoflow' && uri.host == 'login-callback') {
          final error = uri.queryParameters['error'];
          if (error != null && error.isNotEmpty) {
            if (!completer.isCompleted) {
              completer.completeError(
                const OAuthGoogleException(
                  'No se pudo iniciar sesión con Google. Inténtalo de nuevo.',
                ),
              );
            }
            return;
          }

          final refreshToken = uri.queryParameters['refreshToken'];
          if (refreshToken != null && refreshToken.isNotEmpty) {
            try {
              await authApi.apiClient.sesionStore.almacenamiento
                  .guardarRefreshToken(refreshToken);
              final ok = await authApi.restaurarSesion();
              if (!ok) {
                if (!completer.isCompleted) {
                  completer.completeError(
                    const OAuthGoogleException(
                      'No se pudo establecer la sesión con Google. Inténtalo de nuevo.',
                    ),
                  );
                }
                return;
              }
              if (!completer.isCompleted) {
                completer.complete(true);
              }
            } catch (e) {
              if (!completer.isCompleted) {
                completer.completeError(e);
              }
            }
          }
        }
      },
      onError: (Object error) {
        if (!completer.isCompleted) {
          completer.completeError(error);
        }
      },
    );

    try {
      final lanzado = await launchUrl(
        urlAutorizacion,
        mode: LaunchMode.externalApplication,
      );
      if (!lanzado) {
        throw const OAuthGoogleException(
          'No se pudo abrir el navegador del dispositivo para iniciar sesión.',
        );
      }

      return await completer.future.timeout(timeout, onTimeout: () => false);
    } finally {
      await subLocal.cancel();
    }
  }

  void dispose() {
    _suscripcionLinks?.cancel();
    _suscripcionLinks = null;
  }
}
