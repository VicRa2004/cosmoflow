/// Configuración de entorno para el cliente móvil de Cosmoflow.
class Entorno {
  Entorno._();

  static const String _apiUrlDefinida = String.fromEnvironment('API_URL');

  /// URL del servidor desplegado de Cosmoflow.
  static const String urlProduccion = 'https://cosmoflow.saasil.mx/api';

  /// URL base de la API (`/api`).
  /// Por defecto usa `https://cosmoflow.saasil.mx/api`, o el valor pasado con `--dart-define=API_URL=...`.
  static String get apiBaseUrl {
    if (_apiUrlDefinida.isNotEmpty) {
      return _apiUrlDefinida;
    }
    return urlProduccion;
  }
}
