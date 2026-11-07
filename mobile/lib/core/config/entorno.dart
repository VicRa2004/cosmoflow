import 'package:flutter/foundation.dart';

/// Configuración de entorno para el cliente móvil de Cosmoflow.
class Entorno {
  Entorno._();

  static const String _apiUrlDefinida = String.fromEnvironment('API_URL');

  /// URL base de la API (`/api`).
  /// En Android emulador apunta a `10.0.2.2:3000/api` si no se define `API_URL`.
  static String get apiBaseUrl {
    if (_apiUrlDefinida.isNotEmpty) {
      return _apiUrlDefinida;
    }
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:3000/api';
    }
    return 'http://localhost:3000/api';
  }
}
