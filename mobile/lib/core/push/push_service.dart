import 'dart:async';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

import '../api/api_client.dart';

/// Registra el token FCM del dispositivo en el backend (`/api/notificaciones/dispositivos`)
/// mientras haya sesión, para recibir notificaciones push.
class PushService {
  PushService({required this.apiClient, FirebaseMessaging? messaging})
    : _messaging = messaging ?? FirebaseMessaging.instance;

  final ApiClient apiClient;
  final FirebaseMessaging _messaging;
  String? _tokenRegistrado;
  bool _registrado = false;
  StreamSubscription<String>? _refrescos;

  /// Escucha la sesión: al tener access token registra el dispositivo una vez.
  void iniciar() {
    final sesion = apiClient.sesionStore;
    sesion.addListener(() {
      // El store notifica varias veces por sesión: se marca antes del primer await.
      if (sesion.accessToken != null && !_registrado) {
        _registrado = true;
        registrar();
      }
      if (sesion.usuario == null) _registrado = false;
    });
    _refrescos = _messaging.onTokenRefresh.listen((token) {
      if (apiClient.sesionStore.accessToken != null) _enviar(token);
    });
  }

  Future<void> registrar() async {
    try {
      await _messaging.requestPermission();
      final token = await _messaging.getToken();
      if (token != null) await _enviar(token);
    } catch (e) {
      // Sin push no se rompe nada: solo no llegarán notificaciones al móvil.
      debugPrint('No se pudo obtener el token push: $e');
    }
  }

  /// Da de baja el token antes de cerrar sesión (necesita el access token).
  Future<void> darDeBaja() async {
    final token = _tokenRegistrado;
    if (token == null) return;
    _tokenRegistrado = null;
    try {
      await apiClient.dio.delete<void>(
        '/notificaciones/dispositivos',
        data: {'token': token},
      );
    } on DioException {
      // El backend también descarta tokens que FCM marca como inválidos.
    }
  }

  Future<void> _enviar(String token) async {
    try {
      await apiClient.dio.post<void>(
        '/notificaciones/dispositivos',
        data: {
          'token': token,
          'plataforma': Platform.isIOS ? 'ios' : 'android',
        },
      );
      _tokenRegistrado = token;
    } on DioException catch (e) {
      debugPrint('No se pudo registrar el dispositivo push: ${e.message}');
    }
  }

  void dispose() => _refrescos?.cancel();
}
