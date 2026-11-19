import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api/auth_api.dart';

/// Servicio encargado del flujo OAuth con Google en una Custom Tab del navegador
/// del dispositivo (Chrome, Safari, etc.) y deep linking (`cosmoflow://login-callback`).
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

    await _canjear(refreshToken, authApi);
    return true;
  }

  /// Canjes por refresh token, compartidos entre instancias: el listener global y el
  /// de [autenticar] reciben el mismo deep link, y canjear dos veces el mismo token
  /// hace que el backend (que lo rota) rechace el segundo y la sesión falle.
  static final Map<String, Future<bool>> _canjes = {};

  static Future<bool> _canjear(String refreshToken, AuthApi authApi) =>
      _canjes[refreshToken] ??= () async {
        await authApi.apiClient.sesionStore.almacenamiento.guardarRefreshToken(
          refreshToken,
        );
        return authApi.restaurarSesion();
      }();

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
              final ok = await _canjear(refreshToken, authApi);
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
      // Custom Tab (Android) / SFSafariViewController (iOS): ventana dentro de la app
      // que comparte cookies y cuentas con el navegador principal (no es un WebView).
      final lanzado = await launchUrl(
        urlAutorizacion,
        mode: LaunchMode.inAppBrowserView,
      );
      if (!lanzado) {
        throw const OAuthGoogleException(
          'No se pudo abrir el navegador del dispositivo para iniciar sesión.',
        );
      }

      return await completer.future.timeout(timeout, onTimeout: () => false);
    } finally {
      await subLocal.cancel();
      // En iOS cierra el SFSafariViewController; en Android la Custom Tab la cierra
      // `singleTask` del AndroidManifest al volver por el deep link.
      await closeInAppWebView().catchError((_) {});
    }
  }

  void dispose() {
    _suscripcionLinks?.cancel();
    _suscripcionLinks = null;
  }
}
