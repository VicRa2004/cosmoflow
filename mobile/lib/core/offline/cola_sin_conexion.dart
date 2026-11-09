import 'dart:convert';
import 'dart:math';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../api/api_client.dart';

/// Alta hecha sin red: el `POST` que se repetirá al volver la conexión.
class OperacionPendiente {
  const OperacionPendiente({
    required this.usuarioId,
    required this.ruta,
    required this.datos,
    required this.creadaEn,
    required this.clave,
  });

  /// Solo se envía con la sesión de quien la creó.
  final int usuarioId;

  /// `/notas` o `/tareas`.
  final String ruta;
  final Map<String, dynamic> datos;
  final DateTime creadaEn;

  /// `Idempotency-Key`: la misma en cada reintento, para que el servidor no duplique.
  final String clave;

  String get titulo => datos['titulo'] as String? ?? '';

  factory OperacionPendiente.fromJson(Map<String, dynamic> json) =>
      OperacionPendiente(
        usuarioId: (json['usuarioId'] as num).toInt(),
        ruta: json['ruta'] as String,
        datos: Map<String, dynamic>.from(json['datos'] as Map),
        creadaEn: DateTime.parse(json['creadaEn'] as String),
        // Las encoladas por una versión anterior no la traen.
        clave: json['clave'] as String? ?? nuevaClave(),
      );

  static String nuevaClave() {
    final azar = Random.secure();
    return List<String>.generate(
      16,
      (_) => azar.nextInt(256).toRadixString(16).padLeft(2, '0'),
    ).join();
  }

  Options get opciones =>
      Options(headers: <String, String>{'Idempotency-Key': clave});

  Map<String, dynamic> toJson() => <String, dynamic>{
    'usuarioId': usuarioId,
    'ruta': ruta,
    'datos': datos,
    'creadaEn': creadaEn.toIso8601String(),
    'clave': clave,
  };
}

/// Cola persistente (sobrevive a cerrar la app) de notas y tareas creadas sin
/// conexión. Se vacía en orden con [sincronizar].
class ColaSinConexion extends ChangeNotifier {
  ColaSinConexion({required this.apiClient});

  static const String _clave = 'cosmoflow_cola_sin_conexion';
  final ApiClient apiClient;
  List<OperacionPendiente> _operaciones = <OperacionPendiente>[];
  bool _sincronizando = false;

  /// Sin respuesta del servidor: sin red, DNS o timeout. Un 4xx/5xx no lo es.
  static bool esErrorDeRed(Object error) =>
      error is DioException && error.response == null;

  List<OperacionPendiente> pendientes(int usuarioId, String ruta) =>
      _operaciones
          .where((o) => o.usuarioId == usuarioId && o.ruta == ruta)
          .toList(growable: false);

  Future<void> cargar() async {
    final prefs = await SharedPreferences.getInstance();
    final guardado = prefs.getString(_clave);
    if (guardado == null) return;
    _operaciones = (jsonDecode(guardado) as List)
        .map((e) => OperacionPendiente.fromJson(e as Map<String, dynamic>))
        .toList();
    notifyListeners();
  }

  /// `POST` normal; sin red (o en sesión sin conexión) la guarda en la cola y
  /// devuelve `null`. Cualquier otro error se propaga.
  Future<Map<String, dynamic>?> crearOEncolar(
    String ruta,
    Map<String, dynamic> datos,
  ) async {
    final sesion = apiClient.sesionStore;
    final usuario = sesion.usuario;
    // La clave nace antes del primer intento: si el servidor guarda pero la
    // respuesta se pierde, el reintento de la cola no duplica.
    final op = OperacionPendiente(
      usuarioId: usuario?.id ?? 0,
      ruta: ruta,
      datos: datos,
      creadaEn: DateTime.now(),
      clave: OperacionPendiente.nuevaClave(),
    );
    if (!sesion.sinConexion) {
      try {
        final response = await apiClient.dio.post<Map<String, dynamic>>(
          ruta,
          data: datos,
          options: op.opciones,
        );
        return response.data;
      } on DioException catch (e) {
        if (usuario == null || !esErrorDeRed(e)) rethrow;
      }
    }
    if (usuario == null) throw StateError('Sin sesión');
    _operaciones = <OperacionPendiente>[..._operaciones, op];
    await _guardar();
    return null;
  }

  /// Envía en orden las del usuario. Para al primer fallo de red (se reintenta
  /// luego); un rechazo del servidor (4xx) la descarta para no atascar la cola.
  /// Devuelve cuántas se guardaron en el servidor.
  Future<int> sincronizar() async {
    final usuarioId = apiClient.sesionStore.usuario?.id;
    if (_sincronizando || usuarioId == null) return 0;
    _sincronizando = true;
    var enviadas = 0;
    try {
      for (final op
          in pendientes(usuarioId, '/notas') +
              pendientes(usuarioId, '/tareas')) {
        try {
          await apiClient.dio.post<dynamic>(
            op.ruta,
            data: op.datos,
            options: op.opciones,
          );
          enviadas++;
        } on DioException catch (e) {
          if (esErrorDeRed(e)) break;
          final status = e.response?.statusCode ?? 0;
          // 401/5xx: la sesión o el servidor fallan ahora; 409: el primer envío
          // sigue en curso en el servidor. Se reintenta luego.
          if (status == 401 || status == 409 || status >= 500) break;
          debugPrint('Descartada «${op.titulo}» (${op.ruta}): HTTP $status');
        }
        _operaciones = _operaciones.where((o) => o != op).toList();
        await _guardar();
      }
    } finally {
      _sincronizando = false;
    }
    return enviadas;
  }

  Future<void> _guardar() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _clave,
      jsonEncode(_operaciones.map((o) => o.toJson()).toList()),
    );
    notifyListeners();
  }
}
