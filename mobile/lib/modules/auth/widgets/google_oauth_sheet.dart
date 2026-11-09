import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../api/auth_api.dart';

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

/// Orquesta el inicio de sesión o registro con Google sin modificar el backend:
/// 1. Obtiene la URL de autorización y cookie `google_oauth` desde `GET /api/auth/google`.
/// 2. Abre la hoja modal con `WebViewWidget` e intercepta `/api/auth/google/callback`.
/// 3. Canjea `code` + `state` con `GET /api/auth/google/callback` y `POST /api/auth/refresh`.
///
/// Devuelve `true` si la sesión se completó, `false` si el usuario cerró la ventana.
Future<bool> autenticarConGoogleModal({
  required BuildContext context,
  required AuthApi authApi,
}) async {
  final inicio = await authApi.iniciarOAuthGoogle();
  if (!context.mounted) return false;

  final resultado = await showModalBottomSheet<ResultadoCallbackGoogle>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    enableDrag: false,
    backgroundColor: Colors.transparent,
    builder: (sheetContext) =>
        GoogleOAuthSheet(urlAutorizacion: inicio.urlAutorizacion),
  );

  if (resultado == null) {
    return false;
  }

  if (!resultado.esValido) {
    throw const OAuthGoogleException(
      'No se pudo iniciar sesión con Google. Inténtalo de nuevo.',
    );
  }

  await authApi.completarOAuthGoogle(
    code: resultado.code!,
    state: resultado.state!,
    cookieOAuth: inicio.cookieOAuth,
  );
  return true;
}

/// Hoja modal con `WebViewWidget` que carga la pantalla de Google e intercepta el callback.
class GoogleOAuthSheet extends StatefulWidget {
  const GoogleOAuthSheet({super.key, required this.urlAutorizacion});

  final String urlAutorizacion;

  @override
  State<GoogleOAuthSheet> createState() => _GoogleOAuthSheetState();
}

class _GoogleOAuthSheetState extends State<GoogleOAuthSheet> {
  late final WebViewController _controller;
  bool _isCargandoPagina = true;
  bool _callbackProcesado = false;

  static String get _userAgentNavegadorMovil {
    if (defaultTargetPlatform == TargetPlatform.iOS) {
      return 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) '
          'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
    }
    return 'Mozilla/5.0 (Linux; Android 14; Pixel 8) '
        'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';
  }

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setUserAgent(_userAgentNavegadorMovil)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) {
            if (mounted) {
              setState(() => _isCargandoPagina = true);
            }
          },
          onPageFinished: (_) {
            if (mounted) {
              setState(() => _isCargandoPagina = false);
            }
          },
          onNavigationRequest: (request) {
            final resultado = ResultadoCallbackGoogle.intentarExtraer(
              request.url,
            );
            if (resultado != null && !_callbackProcesado) {
              _callbackProcesado = true;
              if (mounted) {
                Navigator.of(context).pop(resultado);
              }
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.urlAutorizacion));
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final altura = MediaQuery.of(context).size.height * 0.88;

    return Container(
      height: altura,
      decoration: BoxDecoration(
        color: colores.superficie,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
        border: Border.all(color: colores.borde, width: 1),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: <Widget>[
          Container(
            height: 48,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: colores.elevada,
              border: Border(bottom: BorderSide(color: colores.borde)),
            ),
            child: Row(
              children: <Widget>[
                Icon(Icons.lock_outline, size: 16, color: colores.tintaSuave),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Continuar con Google',
                    style: textTheme.labelMedium?.copyWith(
                      color: colores.tinta,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, size: 18),
                  color: colores.tintaSuave,
                  tooltip: 'Cancelar',
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),
          if (_isCargandoPagina)
            LinearProgressIndicator(
              minHeight: 2,
              color: colores.indigoMarca,
              backgroundColor: colores.borde,
            ),
          Expanded(child: WebViewWidget(controller: _controller)),
        ],
      ),
    );
  }
}
