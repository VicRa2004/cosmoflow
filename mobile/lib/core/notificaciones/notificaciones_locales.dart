import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest_10y.dart' as tz_data;
import 'package:timezone/timezone.dart' as tz;

import '../auth/sesion_store.dart';

/// Fachada compartida sobre `FlutterLocalNotificationsPlugin` para avisos push
/// en primer plano y recordatorios locales programados.
///
/// Centraliza la inicialización del plugin, los canales de Android, el permiso
/// de notificaciones y la navegación al tocar una notificación.
class NotificacionesLocales {
  NotificacionesLocales({
    required this.sesionStore,
    FlutterLocalNotificationsPlugin? plugin,
  }) : _pluginInyectado = plugin {
    sesionStore.addListener(_intentarNavegarPendiente);
  }

  static const String _canalAvisosId = 'cosmoflow_avisos';
  static const String _canalAvisosNombre = 'Avisos de Cosmoflow';
  static const String _canalAvisosDescripcion =
      'Tareas asignadas, menciones, comentarios y vencimientos.';

  static const String _canalRecordatoriosId = 'cosmoflow_recordatorios';
  static const String _canalRecordatoriosNombre = 'Recordatorios de tareas';
  static const String _canalRecordatoriosDescripcion =
      'Avisos locales de inicio y vencimiento de tareas sin depender de la red.';

  static bool _zonasInicializadas = false;

  final SesionStore sesionStore;
  final FlutterLocalNotificationsPlugin? _pluginInyectado;

  FlutterLocalNotificationsPlugin? _plugin;
  bool _inicializadas = false;
  bool _permisoSolicitado = false;
  int _contadorAvisos = 0;
  void Function(String ruta)? _navegar;
  String? _rutaPendiente;

  static void _asegurarZonas() {
    if (_zonasInicializadas) return;
    tz_data.initializeTimeZones();
    _zonasInicializadas = true;
  }

  /// Conecta `go_router` para abrir la ruta cuando el usuario toca una notificación.
  void vincularNavegador(void Function(String ruta) navegar) {
    _navegar = navegar;
    _intentarNavegarPendiente();
  }

  /// Inicializa el plugin y los canales Android una sola vez.
  Future<bool> inicializar() async {
    if (_inicializadas) return true;
    try {
      _asegurarZonas();
      final plugin = _pluginInyectado ?? FlutterLocalNotificationsPlugin();
      const android = AndroidInitializationSettings('@mipmap/ic_launcher');
      // Pedimos el permiso explícitamente al entrar con sesión activa.
      const darwin = DarwinInitializationSettings(
        requestAlertPermission: false,
        requestBadgePermission: false,
        requestSoundPermission: false,
      );
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

      final androidImpl = plugin
          .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin
          >();
      await androidImpl?.createNotificationChannel(
        const AndroidNotificationChannel(
          _canalAvisosId,
          _canalAvisosNombre,
          description: _canalAvisosDescripcion,
          importance: Importance.high,
        ),
      );
      await androidImpl?.createNotificationChannel(
        const AndroidNotificationChannel(
          _canalRecordatoriosId,
          _canalRecordatoriosNombre,
          description: _canalRecordatoriosDescripcion,
          importance: Importance.high,
        ),
      );

      final detallesInicio = await plugin.getNotificationAppLaunchDetails();
      if (detallesInicio != null && detallesInicio.didNotificationLaunchApp) {
        _manejarPayload(detallesInicio.notificationResponse?.payload);
      }

      _plugin = plugin;
      _inicializadas = true;
      return true;
    } catch (e) {
      debugPrint('No se pudieron inicializar notificaciones locales: $e');
      return false;
    }
  }

  /// Solicita el permiso del sistema operativo la primera vez que se invoca.
  Future<void> solicitarPermiso() async {
    if (_permisoSolicitado) return;
    if (!await inicializar()) return;
    final plugin = _plugin;
    if (plugin == null) return;
    _permisoSolicitado = true;
    try {
      await plugin
          .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin
          >()
          ?.requestNotificationsPermission();
      await plugin
          .resolvePlatformSpecificImplementation<
            IOSFlutterLocalNotificationsPlugin
          >()
          ?.requestPermissions(alert: true, badge: true, sound: true);
      await plugin
          .resolvePlatformSpecificImplementation<
            MacOSFlutterLocalNotificationsPlugin
          >()
          ?.requestPermissions(alert: true, badge: true, sound: true);
    } catch (e) {
      debugPrint('No se pudo solicitar permiso de notificaciones: $e');
    }
  }

  /// Muestra un aviso inmediato (usado por `PushService` en primer plano).
  Future<void> mostrarAviso({
    required String titulo,
    required String cuerpo,
    String? payload,
  }) async {
    if (!await inicializar()) return;
    final plugin = _plugin;
    if (plugin == null) return;

    _contadorAvisos = (_contadorAvisos % 999000) + 1;
    await plugin.show(
      id: _contadorAvisos,
      title: titulo,
      body: cuerpo,
      notificationDetails: const NotificationDetails(
        android: AndroidNotificationDetails(
          _canalAvisosId,
          _canalAvisosNombre,
          channelDescription: _canalAvisosDescripcion,
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: DarwinNotificationDetails(),
      ),
      payload: payload,
    );
  }

  /// Programa un recordatorio local en la fecha/hora local indicada.
  Future<void> programarRecordatorio({
    required int id,
    required String titulo,
    required String cuerpo,
    required DateTime fechaLocal,
    String? payload,
  }) async {
    if (!await inicializar()) return;
    final plugin = _plugin;
    if (plugin == null) return;

    final fechaTz = tz.TZDateTime.from(fechaLocal, tz.UTC);
    await plugin.zonedSchedule(
      id: id,
      scheduledDate: fechaTz,
      title: titulo,
      body: cuerpo,
      payload: payload,
      androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
      notificationDetails: const NotificationDetails(
        android: AndroidNotificationDetails(
          _canalRecordatoriosId,
          _canalRecordatoriosNombre,
          channelDescription: _canalRecordatoriosDescripcion,
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: DarwinNotificationDetails(),
      ),
    );
  }

  /// Cancela una notificación pendiente por su identificador.
  Future<void> cancelar(int id) async {
    if (!await inicializar()) return;
    final plugin = _plugin;
    if (plugin == null) return;
    await plugin.cancel(id: id);
  }

  /// Lista los IDs de las notificaciones locales actualmente programadas.
  Future<List<int>> idsPendientes() async {
    if (!await inicializar()) return const <int>[];
    final plugin = _plugin;
    if (plugin == null) return const <int>[];
    final lista = await plugin.pendingNotificationRequests();
    return lista.map((r) => r.id).toList(growable: false);
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
    if (!sesionStore.isAutenticado) return;
    _rutaPendiente = null;
    navegar(ruta);
  }

  void dispose() {
    sesionStore.removeListener(_intentarNavegarPendiente);
  }
}
