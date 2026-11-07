import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Contrato de almacenamiento seguro para tokens de autenticación.
abstract class AlmacenamientoSeguro {
  Future<String?> leerRefreshToken();
  Future<void> guardarRefreshToken(String token);
  Future<void> eliminarRefreshToken();
}

/// Implementación respaldada por Keychain (iOS) y Keystore (Android).
class FlutterAlmacenamientoSeguro implements AlmacenamientoSeguro {
  FlutterAlmacenamientoSeguro({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage();

  static const String _claveRefreshToken = 'cosmoflow_refresh_token';
  final FlutterSecureStorage _storage;

  @override
  Future<String?> leerRefreshToken() {
    return _storage.read(key: _claveRefreshToken);
  }

  @override
  Future<void> guardarRefreshToken(String token) {
    return _storage.write(key: _claveRefreshToken, value: token);
  }

  @override
  Future<void> eliminarRefreshToken() {
    return _storage.delete(key: _claveRefreshToken);
  }
}

/// Implementación en memoria útil para pruebas unitarias y de widgets.
class MemoriaAlmacenamientoSeguro implements AlmacenamientoSeguro {
  String? _refreshToken;

  @override
  Future<String?> leerRefreshToken() async => _refreshToken;

  @override
  Future<void> guardarRefreshToken(String token) async {
    _refreshToken = token;
  }

  @override
  Future<void> eliminarRefreshToken() async {
    _refreshToken = null;
  }
}
