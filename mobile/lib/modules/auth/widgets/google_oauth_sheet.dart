import 'package:flutter/material.dart';

import '../api/auth_api.dart';
import '../services/oauth_google_service.dart';

/// Resultado devuelto al interceptar la redirección `/api/auth/google/callback`.
class ResultadoCallbackGoogle {
  const ResultadoCallbackGoogle({this.code, this.state, this.error});

  final String? code;
  final String? state;
  final String? error;

  bool get esValido =>
      error == null &&
      code != null &&
      code!.isNotEmpty &&
      state != null &&
      state!.isNotEmpty;

  /// Analiza una URL de navegación y devuelve un [ResultadoCallbackGoogle] si
  /// corresponde al callback de Google OAuth (`/api/auth/google/callback` o `/login?error=google`).
  static ResultadoCallbackGoogle? intentarExtraer(String rawUrl) {
    final uri = Uri.tryParse(rawUrl);
    if (uri == null) return null;

    if (uri.path.endsWith('/auth/google/callback')) {
      final error = uri.queryParameters['error'];
      if (error != null && error.isNotEmpty) {
        return ResultadoCallbackGoogle(error: error);
      }
      return ResultadoCallbackGoogle(
        code: uri.queryParameters['code'],
        state: uri.queryParameters['state'],
      );
    }

    if (uri.path.endsWith('/login') &&
        uri.queryParameters['error'] == 'google') {
      return const ResultadoCallbackGoogle(error: 'google');
    }

    return null;
  }
}

/// Instancia compartida del servicio de Google OAuth con navegador del dispositivo.
final OAuthGoogleService _oauthGoogleService = OAuthGoogleService();

/// Orquesta el inicio de sesión o registro con Google utilizando el navegador
/// externo del dispositivo (Chrome, Safari, etc.) en lugar de un WebView integrado.
///
/// 1. Abre el navegador del dispositivo con `${apiClient.baseUrl}/auth/google?movil=1`.
/// 2. Google OAuth usa las cuentas del sistema operativo.
/// 3. El backend devuelve un deep link `cosmoflow://login-callback?refreshToken=...`.
/// 4. La app captura el deep link, persiste el token y restaura la sesión.
Future<bool> autenticarConGoogleModal({
  required BuildContext context,
  required AuthApi authApi,
}) async {
  return _oauthGoogleService.autenticar(authApi: authApi);
}

/// Alias descriptivo para el flujo de autenticación con el navegador del dispositivo.
Future<bool> autenticarConGoogleNavegador({required AuthApi authApi}) async {
  return _oauthGoogleService.autenticar(authApi: authApi);
}
