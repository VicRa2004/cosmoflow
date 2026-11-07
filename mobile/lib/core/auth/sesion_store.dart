import 'package:flutter/material.dart';
import 'almacenamiento_seguro.dart';
import 'usuario_sesion.dart';

/// Estado reactivo de la sesión, permisos efectivos y preferencias de tema transversal.
class SesionStore extends ChangeNotifier {
  SesionStore({AlmacenamientoSeguro? almacenamientoSeguro})
      : _almacenamiento = almacenamientoSeguro ?? FlutterAlmacenamientoSeguro();

  final AlmacenamientoSeguro _almacenamiento;

  String? _accessToken;
  UsuarioSesion? _usuario;
  Set<String> _permisos = const <String>{};
  bool _todosLosPermisos = true;
  ThemeMode _modoTema = ThemeMode.system;

  String? get accessToken => _accessToken;
  UsuarioSesion? get usuario => _usuario;
  ThemeMode get modoTema => _modoTema;
  bool get isAutenticado => _accessToken != null && _usuario != null;
  bool get esAdmin => _usuario?.roles.contains('ADMIN') ?? false;

  AlmacenamientoSeguro get almacenamiento => _almacenamiento;

  /// Verifica si el usuario tiene el permiso `recurso:accion`.
  bool puede(String? permiso) {
    if (permiso == null || permiso.isEmpty) return true;
    if (_todosLosPermisos) return true;
    return _permisos.contains(permiso);
  }

  /// Establece la sesión activa en memoria tras login, registro o refresh.
  void establecerSesion({
    required String accessToken,
    required UsuarioSesion usuario,
  }) {
    _accessToken = accessToken;
    _usuario = usuario;
    notifyListeners();
  }

  /// Actualiza los permisos efectivos descargados de `GET /api/permisos/mios`.
  void establecerPermisos(Set<String> permisos, {bool permitirTodos = false}) {
    _permisos = Set<String>.unmodifiable(permisos);
    _todosLosPermisos = permitirTodos;
    notifyListeners();
  }

  /// Actualiza únicamente el accessToken cuando el endpoint no devuelve el usuario.
  void actualizarAccessToken(String nuevoAccessToken) {
    _accessToken = nuevoAccessToken;
    notifyListeners();
  }

  /// Limpia la sesión en memoria y borra el `refresh_token` del llavero seguro.
  Future<void> limpiarSesion() async {
    _accessToken = null;
    _usuario = null;
    _permisos = const <String>{};
    _todosLosPermisos = true;
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
