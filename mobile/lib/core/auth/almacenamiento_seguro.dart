import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Contrato de almacenamiento seguro para tokens de autenticación.
abstract class AlmacenamientoSeguro {
  Future<String?> leerRefreshToken();
  Future<void> guardarRefreshToken(String token);
  Future<void> eliminarRefreshToken();

  /// JSON del último usuario con sesión, para entrar sin conexión.
  Future<String?> leerUsuario();

  /// `null` lo borra.
  Future<void> guardarUsuario(String? json);
}

/// Implementación respaldada por Keychain (iOS) y Keystore (Android).
class FlutterAlmacenamientoSeguro implements AlmacenamientoSeguro {
  FlutterAlmacenamientoSeguro({FlutterSecureStorage? storage})
    : _storage = storage ?? const FlutterSecureStorage();

  static const String _claveRefreshToken = 'cosmoflow_refresh_token';
  static const String _claveUsuario = 'cosmoflow_usuario';
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

  @override
  Future<String?> leerUsuario() => _storage.read(key: _claveUsuario);

  @override
  Future<void> guardarUsuario(String? json) => json == null
      ? _storage.delete(key: _claveUsuario)
      : _storage.write(key: _claveUsuario, value: json);
}

/// Implementación en memoria útil para pruebas unitarias y de widgets.
class MemoriaAlmacenamientoSeguro implements AlmacenamientoSeguro {
  String? _refreshToken;
  String? _usuario;

  @override
  Future<String?> leerUsuario() async => _usuario;

  @override
  Future<void> guardarUsuario(String? json) async {
    _usuario = json;
  }

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
