import 'package:flutter/material.dart';
import 'almacenamiento_seguro.dart';
import 'usuario_sesion.dart';

/// Estado reactivo de la sesión y preferencias de tema transversal.
class SesionStore extends ChangeNotifier {
  SesionStore({AlmacenamientoSeguro? almacenamientoSeguro})
      : _almacenamiento = almacenamientoSeguro ?? FlutterAlmacenamientoSeguro();

  final AlmacenamientoSeguro _almacenamiento;

  String? _accessToken;
  UsuarioSesion? _usuario;
  ThemeMode _modoTema = ThemeMode.system;

  String? get accessToken => _accessToken;
  UsuarioSesion? get usuario => _usuario;
  ThemeMode get modoTema => _modoTema;
  bool get isAutenticado => _accessToken != null && _usuario != null;

  AlmacenamientoSeguro get almacenamiento => _almacenamiento;

  /// Establece la sesión activa en memoria tras login, registro o refresh.
  void establecerSesion({
    required String accessToken,
    required UsuarioSesion usuario,
  }) {
    _accessToken = accessToken;
    _usuario = usuario;
    notifyListeners();
  }

  /// Actualiza únicamente el accessToken cuando el endpoint no devuelve el usuario (p. ej. cambio de contraseña).
  void actualizarAccessToken(String nuevoAccessToken) {
    _accessToken = nuevoAccessToken;
    notifyListeners();
  }

  /// Limpia la sesión en memoria y borra el `refresh_token` del llavero seguro.
  Future<void> limpiarSesion() async {
    _accessToken = null;
    _usuario = null;
    await _almacenamiento.eliminarRefreshToken();
    notifyListeners();
  }

  /// Cambia el modo de tema de la interfaz (claro, oscuro, sistema).
  void cambiarModoTema(ThemeMode nuevoModo) {
    if (_modoTema == nuevoModo) return;
    _modoTema = nuevoModo;
    notifyListeners();
  }
}
