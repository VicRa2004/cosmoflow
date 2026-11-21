import 'dart:async';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../../modules/notificaciones/api/notificaciones_api.dart';
import '../api/api_client.dart';

typedef MostrarLocalCallback = Future<void> Function({
  required String titulo,
  required String cuerpo,
  String? payload,
});

/// Gestiona el ciclo completo de notificaciones push FCM:
/// - Comprueba `GET /api/notificaciones/movil` antes de registrar el dispositivo.
/// - Registra y da de baja el token FCM en `/api/notificaciones/dispositivos`.
/// - Muestra notificaciones en primer plano con `flutter_local_notifications`.
/// - Navega a `/tareas/:id` o `/notas/:id` al tocar una notificación.
class PushService {
  PushService({
    required this.apiClient,
    NotificacionesApi? notificacionesApi,
    this._messaging,
    this._localNotifications,
    this._solicitarPermiso,
    this._obtenerToken,
    this._streamRefrescoToken,
    this._streamMensajePrimerPlano,
    this._streamMensajeAbierto,
    this._obtenerMensajeInicial,
    this._mostrarNotificacionLocal,
    this._plataforma,
    this.onDispositivoRegistrado,
  }) : _notificacionesApi =
           notificacionesApi ?? NotificacionesApi(apiClient: apiClient);

  static const String _canalAndroidId = 'cosmoflow_avisos';
  static const String _canalAndroidNombre = 'Avisos de Cosmoflow';
  static const String _canalAndroidDescripcion =
      'Tareas asignadas, menciones, comentarios y vencimientos.';

  final ApiClient apiClient;
  final NotificacionesApi _notificacionesApi;
  final FirebaseMessaging? _messaging;
  final FlutterLocalNotificationsPlugin? _localNotifications;
  final Future<void> Function()? _solicitarPermiso;
  final Future<String?> Function()? _obtenerToken;
  final Stream<String>? _streamRefrescoToken;
  final Stream<RemoteMessage>? _streamMensajePrimerPlano;
  final Stream<RemoteMessage>? _streamMensajeAbierto;
  final Future<RemoteMessage?> Function()? _obtenerMensajeInicial;
  final MostrarLocalCallback? _mostrarNotificacionLocal;
  final String? _plataforma;

  /// Callback opcional que se invoca tras registrar el dispositivo con éxito.
  VoidCallback? onDispositivoRegistrado;

  FlutterLocalNotificationsPlugin? _pluginLocal;
  bool _localesInicializadas = false;
  String? _tokenRegistrado;
  bool _registrado = false;
  void Function(String ruta)? _navegar;
  String? _rutaPendiente;
  int _contadorNotificaciones = 0;

  StreamSubscription<String>? _subRefrescos;
  StreamSubscription<RemoteMessage>? _subPrimerPlano;
  StreamSubscription<RemoteMessage>? _subAbierta;

  FirebaseMessaging get _fcm => _messaging ?? FirebaseMessaging.instance;

  /// Convierte los datos del payload FCM (`tipo` + `id`) en una ruta de `go_router`.
  static String? rutaDesdeDatos(Map<String, dynamic> data) {
    final tipo = data['tipo']?.toString().trim();
    final id = int.tryParse(data['id']?.toString().trim() ?? '');
    if (id == null || id <= 0) return null;
    if (tipo == 'tarea') return '/tareas/$id';
    if (tipo == 'nota') return '/notas/$id';
    return null;
  }

  /// Conecta el navegador (`go_router`) para abrir la ruta al tocar una notificación.
  void vincularNavegador(void Function(String ruta) navegar) {
    _navegar = navegar;
    _intentarNavegarPendiente();
  }

  /// Inicia listeners de sesión, refresco de token, primer plano y apertura.
  void iniciar() {
    final sesion = apiClient.sesionStore;
    sesion.addListener(_onCambioSesion);
    _onCambioSesion();

    if (_mostrarNotificacionLocal == null) {
      unawaited(_inicializarLocales());
    }

    final refrescos = _streamRefrescoToken ?? _fcm.onTokenRefresh;
    _subRefrescos = refrescos.listen((token) {
      if (apiClient.sesionStore.accessToken != null && _registrado) {
        _enviar(token);
      }
    });

    final enPrimerPlano =
        _streamMensajePrimerPlano ?? FirebaseMessaging.onMessage;
    _subPrimerPlano = enPrimerPlano.listen(_alRecibirEnPrimerPlano);

    final alAbrir =
        _streamMensajeAbierto ?? FirebaseMessaging.onMessageOpenedApp;
    _subAbierta = alAbrir.listen(_alAbrirMensaje);

    final inicial = _obtenerMensajeInicial ?? _fcm.getInitialMessage;
    inicial()
        .then((mensaje) {
          if (mensaje != null) _alAbrirMensaje(mensaje);
        })
        .catchError((Object e) {
          debugPrint('No se pudo leer el mensaje inicial push: $e');
        });
  }

  void _onCambioSesion() {
    final sesion = apiClient.sesionStore;
    if (sesion.accessToken != null && !_registrado) {
      _registrado = true;
      registrar();
    }
    if (sesion.usuario == null) {
      _registrado = false;
    }
    _intentarNavegarPendiente();
  }

  Future<void> _inicializarLocales() async {
    if (_localesInicializadas) return;
    try {
      final plugin = _localNotifications ?? FlutterLocalNotificationsPlugin();
      const android = AndroidInitializationSettings('@mipmap/ic_launcher');
      const darwin = DarwinInitializationSettings();
      await plugin.initialize(
        settings: const InitializationSettings(
          android: android,
          iOS: darwin,
          macOS: darwin,
        ),
        onDidReceiveNotificationResponse: (respuesta) {
          _manejarPayload(respuesta.payload);
        },
      );
      await plugin
          .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin
          >()
          ?.createNotificationChannel(
            const AndroidNotificationChannel(
              _canalAndroidId,
              _canalAndroidNombre,
              description: _canalAndroidDescripcion,
              importance: Importance.high,
            ),
          );
      _pluginLocal = plugin;
      _localesInicializadas = true;
    } catch (e) {
      debugPrint('No se pudieron inicializar notificaciones locales: $e');
    }
  }

  /// Comprueba si el backend tiene push móvil disponible y registra el token FCM.
  Future<void> registrar() async {
    try {
      final estado = await _notificacionesApi.estadoMovil();
      if (!estado.disponible) {
        _registrado = false;
        return;
      }

      if (_solicitarPermiso != null) {
        await _solicitarPermiso();
      } else {
        await _fcm.requestPermission();
      }

      final token = _obtenerToken != null
          ? await _obtenerToken()
          : await _fcm.getToken();
      if (token != null && token.isNotEmpty) {
        await _enviar(token);
      }
    } catch (e) {
      // Sin push no se rompe nada: solo no llegarán notificaciones al móvil.
      debugPrint('No se pudo registrar el token push: $e');
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
        data: <String, dynamic>{'token': token},
      );
    } on DioException {
      // El backend también descarta tokens que FCM marca como inválidos.
    }
  }

  Future<void> _enviar(String token) async {
    try {
      final plataforma = _plataforma ?? (Platform.isIOS ? 'ios' : 'android');
      await apiClient.dio.post<void>(
        '/notificaciones/dispositivos',
        data: <String, dynamic>{'token': token, 'plataforma': plataforma},
      );
      _tokenRegistrado = token;
      onDispositivoRegistrado?.call();
    } on DioException catch (e) {
      debugPrint('No se pudo registrar el dispositivo push: ${e.message}');
    }
  }

  Future<void> _alRecibirEnPrimerPlano(RemoteMessage mensaje) async {
    final titulo =
        mensaje.notification?.title ??
        mensaje.data['titulo']?.toString() ??
        'Cosmoflow';
    final cuerpo =
        mensaje.notification?.body ?? mensaje.data['cuerpo']?.toString() ?? '';
    if (titulo.trim().isEmpty && cuerpo.trim().isEmpty) return;

    final payload = rutaDesdeDatos(mensaje.data);
    if (_mostrarNotificacionLocal != null) {
      await _mostrarNotificacionLocal(
        titulo: titulo,
        cuerpo: cuerpo,
        payload: payload,
      );
      return;
    }

    if (!_localesInicializadas) await _inicializarLocales();
    final plugin = _pluginLocal;
    if (plugin == null) return;

    _contadorNotificaciones += 1;
    await plugin.show(
      id: _contadorNotificaciones,
      title: titulo,
      body: cuerpo,
      notificationDetails: const NotificationDetails(
        android: AndroidNotificationDetails(
          _canalAndroidId,
          _canalAndroidNombre,
          channelDescription: _canalAndroidDescripcion,
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: DarwinNotificationDetails(),
      ),
      payload: payload,
    );
  }

  void _alAbrirMensaje(RemoteMessage mensaje) {
    _manejarPayload(rutaDesdeDatos(mensaje.data));
  }

  void _manejarPayload(String? ruta) {
    if (ruta == null || ruta.isEmpty) return;
    _rutaPendiente = ruta;
    _intentarNavegarPendiente();
  }

  void _intentarNavegarPendiente() {
    final ruta = _rutaPendiente;
    final navegar = _navegar;
    if (ruta == null || navegar == null) return;
    if (!apiClient.sesionStore.isAutenticado) return;
    _rutaPendiente = null;
    navegar(ruta);
  }

  void dispose() {
    apiClient.sesionStore.removeListener(_onCambioSesion);
    _subRefrescos?.cancel();
    _subPrimerPlano?.cancel();
    _subAbierta?.cancel();
  }
}
