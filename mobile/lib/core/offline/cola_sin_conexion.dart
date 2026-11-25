import 'dart:convert';
import 'dart:math';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../api/api_client.dart';

/// Tipo de mutación encolada sin conexión.
enum TipoOperacionOffline {
  crear('crear'),
  actualizar('actualizar'),
  eliminar('eliminar');

  const TipoOperacionOffline(this.valor);
  final String valor;

  static TipoOperacionOffline fromValor(String? valor) {
    for (final tipo in TipoOperacionOffline.values) {
      if (tipo.valor == valor) return tipo;
    }
    return TipoOperacionOffline.crear;
  }
}

/// Aviso generado al sincronizar si el servidor tenía una versión más nueva
/// (se aplica «gana el último cambio») o si la entidad ya había sido eliminada.
class ConflictoSincronizacion {
  const ConflictoSincronizacion({
    required this.usuarioId,
    required this.ruta,
    required this.entidadId,
    required this.titulo,
    this.eliminadaEnServidor = false,
  });

  final int usuarioId;
  final String ruta;
  final int entidadId;
  final String titulo;
  final bool eliminadaEnServidor;

  String get mensaje {
    final nombre = titulo.trim().isEmpty ? '#$entidadId' : '«$titulo»';
    if (eliminadaEnServidor) {
      return '$nombre ya había sido eliminada en el servidor.';
    }
    return 'Se sincronizó $nombre (sobrescribió una versión más nueva del servidor).';
  }
}

/// Operación hecha sin red que se repetirá al volver la conexión.
class OperacionPendiente {
  const OperacionPendiente({
    required this.usuarioId,
    required this.ruta,
    required this.datos,
    required this.creadaEn,
    required this.clave,
    this.tipo = TipoOperacionOffline.crear,
    this.entidadId,
    this.tituloReferencia,
    this.baseServidor,
  });

  /// Solo se envía con la sesión de quien la creó.
  final int usuarioId;

  /// Colección base: `/notas` o `/tareas`.
  final String ruta;
  final TipoOperacionOffline tipo;
  final int? entidadId;
  final Map<String, dynamic> datos;
  final String? tituloReferencia;

  /// Snapshot de campos antes del cambio offline para detectar versiones más
  /// nuevas en el servidor al sincronizar.
  final Map<String, dynamic>? baseServidor;
  final DateTime creadaEn;

  /// `Idempotency-Key`: la misma en cada reintento de `POST`, para no duplicar.
  final String clave;

  String get titulo {
    final enDatos = datos['titulo'];
    if (enDatos is String && enDatos.trim().isNotEmpty) return enDatos.trim();
    if (tituloReferencia != null && tituloReferencia!.trim().isNotEmpty) {
      return tituloReferencia!.trim();
    }
    return entidadId != null ? '#$entidadId' : '';
  }

  /// Ruta exacta de la petición HTTP (`/tareas` o `/tareas/12`).
  String get rutaPeticion => entidadId == null ? ruta : '$ruta/$entidadId';

  String get etiquetaTipo {
    return switch (tipo) {
      TipoOperacionOffline.crear => 'Nueva',
      TipoOperacionOffline.eliminar => 'Eliminada',
      TipoOperacionOffline.actualizar =>
        datos.length == 1 && datos.containsKey('estado')
            ? (datos['estado'] == 'completada' ? 'Completada' : 'Reabierta')
            : 'Editada',
    };
  }

  OperacionPendiente copyWith({
    Map<String, dynamic>? datos,
    String? tituloReferencia,
    DateTime? creadaEn,
  }) {
    return OperacionPendiente(
      usuarioId: usuarioId,
      ruta: ruta,
      tipo: tipo,
      entidadId: entidadId,
      datos: datos ?? this.datos,
      tituloReferencia: tituloReferencia ?? this.tituloReferencia,
      baseServidor: baseServidor,
      creadaEn: creadaEn ?? this.creadaEn,
      clave: clave,
    );
  }

  factory OperacionPendiente.fromJson(Map<String, dynamic> json) =>
      OperacionPendiente(
        usuarioId: (json['usuarioId'] as num).toInt(),
        ruta: json['ruta'] as String,
        tipo: TipoOperacionOffline.fromValor(json['tipo'] as String?),
        entidadId: (json['entidadId'] as num?)?.toInt(),
        datos: Map<String, dynamic>.from(
          (json['datos'] as Map?) ?? const <String, dynamic>{},
        ),
        tituloReferencia: json['tituloReferencia'] as String?,
        baseServidor: json['baseServidor'] is Map
            ? Map<String, dynamic>.from(json['baseServidor'] as Map)
            : null,
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
    'tipo': tipo.valor,
    if (entidadId != null) 'entidadId': entidadId,
    'datos': datos,
    if (tituloReferencia != null) 'tituloReferencia': tituloReferencia,
    if (baseServidor != null) 'baseServidor': baseServidor,
    'creadaEn': creadaEn.toIso8601String(),
    'clave': clave,
  };
}

/// Cola persistente (sobrevive a cerrar la app) de altas, ediciones,
/// completados y borrados de notas y tareas hechos sin conexión.
/// Se vacía en orden con [sincronizar]; ante conflicto gana el último cambio
/// y se registra un [ConflictoSincronizacion] para avisar al usuario.
class ColaSinConexion extends ChangeNotifier {
  ColaSinConexion({required this.apiClient});

  static const String _clave = 'cosmoflow_cola_sin_conexion';
  final ApiClient apiClient;
  List<OperacionPendiente> _operaciones = <OperacionPendiente>[];
  final List<ConflictoSincronizacion> _conflictos = <ConflictoSincronizacion>[];
  bool _sincronizando = false;

  /// Sin respuesta del servidor: sin red, DNS o timeout. Un 4xx/5xx no lo es.
  static bool esErrorDeRed(Object error) =>
      error is DioException && error.response == null;

  List<OperacionPendiente> pendientes(int usuarioId, String ruta) =>
      _operaciones
          .where((o) => o.usuarioId == usuarioId && o.ruta == ruta)
          .toList(growable: false);

  /// Indica si la entidad tiene una edición o borrado pendiente de subir.
  bool tieneCambiosPendientes(int usuarioId, String ruta, int entidadId) =>
      _operaciones.any(
        (o) =>
            o.usuarioId == usuarioId &&
            o.ruta == ruta &&
            o.entidadId == entidadId,
      );

  /// Indica si la entidad tiene un borrado pendiente de subir.
  bool estaEliminadaPendiente(int usuarioId, String ruta, int entidadId) =>
      _operaciones.any(
        (o) =>
            o.usuarioId == usuarioId &&
            o.ruta == ruta &&
            o.entidadId == entidadId &&
            o.tipo == TipoOperacionOffline.eliminar,
      );

  /// Devuelve el mapa combinado de cambios `actualizar` pendientes para una entidad.
  Map<String, dynamic>? cambiosPendientes(
    int usuarioId,
    String ruta,
    int entidadId,
  ) {
    Map<String, dynamic>? combinado;
    for (final op in _operaciones) {
      if (op.usuarioId == usuarioId &&
          op.ruta == ruta &&
          op.entidadId == entidadId &&
          op.tipo == TipoOperacionOffline.actualizar) {
        combinado = <String, dynamic>{...?combinado, ...op.datos};
      }
    }
    return combinado;
  }

  /// Extrae y limpia los avisos de conflicto pendientes para un usuario y ruta.
  List<ConflictoSincronizacion> consumirConflictos(int usuarioId, String ruta) {
    final propios = _conflictos
        .where((c) => c.usuarioId == usuarioId && c.ruta == ruta)
        .toList(growable: false);
    if (propios.isNotEmpty) {
      _conflictos.removeWhere(
        (c) => c.usuarioId == usuarioId && c.ruta == ruta,
      );
    }
    return propios;
  }

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
    final op = OperacionPendiente(
      usuarioId: usuario?.id ?? 0,
      ruta: ruta,
      tipo: TipoOperacionOffline.crear,
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

  /// `PUT` normal; sin red la guarda en la cola (fusionando con ediciones
  /// previas de la misma entidad) y devuelve `null`.
  Future<Map<String, dynamic>?> actualizarOEncolar(
    String ruta,
    int entidadId,
    Map<String, dynamic> datos, {
    String? titulo,
    Map<String, dynamic>? baseServidor,
  }) async {
    final sesion = apiClient.sesionStore;
    final usuario = sesion.usuario;
    if (!sesion.sinConexion) {
      try {
        final response = await apiClient.dio.put<Map<String, dynamic>>(
          '$ruta/$entidadId',
          data: datos,
        );
        return response.data;
      } on DioException catch (e) {
        if (usuario == null || !esErrorDeRed(e)) rethrow;
      }
    }
    if (usuario == null) throw StateError('Sin sesión');

    final idx = _operaciones.indexWhere(
      (o) =>
          o.usuarioId == usuario.id &&
          o.ruta == ruta &&
          o.entidadId == entidadId &&
          o.tipo == TipoOperacionOffline.actualizar,
    );
    if (idx >= 0) {
      final previa = _operaciones[idx];
      final lista = List<OperacionPendiente>.from(_operaciones);
      lista[idx] = previa.copyWith(
        datos: <String, dynamic>{...previa.datos, ...datos},
        tituloReferencia: titulo ?? previa.tituloReferencia,
        creadaEn: DateTime.now(),
      );
      _operaciones = lista;
    } else {
      _operaciones = <OperacionPendiente>[
        ..._operaciones,
        OperacionPendiente(
          usuarioId: usuario.id,
          ruta: ruta,
          tipo: TipoOperacionOffline.actualizar,
          entidadId: entidadId,
          datos: Map<String, dynamic>.from(datos),
          tituloReferencia: titulo,
          baseServidor: baseServidor,
          creadaEn: DateTime.now(),
          clave: OperacionPendiente.nuevaClave(),
        ),
      ];
    }
    await _guardar();
    return null;
  }

  /// `DELETE` normal; devuelve `true` si se borró en el servidor o `false` si
  /// quedó encolado sin conexión.
  Future<bool> eliminarOEncolar(
    String ruta,
    int entidadId, {
    String? titulo,
  }) async {
    final sesion = apiClient.sesionStore;
    final usuario = sesion.usuario;
    if (!sesion.sinConexion) {
      try {
        await apiClient.dio.delete<void>('$ruta/$entidadId');
        return true;
      } on DioException catch (e) {
        if (usuario == null || !esErrorDeRed(e)) rethrow;
      }
    }
    if (usuario == null) throw StateError('Sin sesión');

    // Un borrado descarta cualquier edición pendiente de esa misma entidad.
    final filtradas = _operaciones
        .where(
          (o) =>
              !(o.usuarioId == usuario.id &&
                  o.ruta == ruta &&
                  o.entidadId == entidadId),
        )
        .toList();
    filtradas.add(
      OperacionPendiente(
        usuarioId: usuario.id,
        ruta: ruta,
        tipo: TipoOperacionOffline.eliminar,
        entidadId: entidadId,
        datos: const <String, dynamic>{},
        tituloReferencia: titulo,
        creadaEn: DateTime.now(),
        clave: OperacionPendiente.nuevaClave(),
      ),
    );
    _operaciones = filtradas;
    await _guardar();
    return false;
  }

  /// Envía en orden cronológico las operaciones pendientes del usuario.
  /// Para al primer fallo de red (se reintenta luego); un rechazo 4xx la
  /// descarta para no atascar la cola. Devuelve cuántas se aplicaron.
  Future<int> sincronizar() async {
    final usuarioId = apiClient.sesionStore.usuario?.id;
    if (_sincronizando || usuarioId == null) return 0;
    _sincronizando = true;
    var enviadas = 0;
    try {
      final delUsuario = _operaciones
          .where((o) => o.usuarioId == usuarioId)
          .toList(growable: false);
      for (final op in delUsuario) {
        try {
          final aplicada = await _enviarOperacion(op);
          if (aplicada) enviadas++;
        } on DioException catch (e) {
          if (esErrorDeRed(e)) break;
          final status = e.response?.statusCode ?? 0;
          // 401/5xx: la sesión o el servidor fallan ahora; 409: reintento en curso.
          if (status == 401 || status == 409 || status >= 500) break;
          debugPrint(
            'Descartada «${op.titulo}» (${op.rutaPeticion}): HTTP $status',
          );
        }
        _operaciones = _operaciones.where((o) => o != op).toList();
        await _guardar();
      }
    } finally {
      _sincronizando = false;
    }
    return enviadas;
  }

  Future<bool> _enviarOperacion(OperacionPendiente op) async {
    switch (op.tipo) {
      case TipoOperacionOffline.crear:
        await apiClient.dio.post<dynamic>(
          op.ruta,
          data: op.datos,
          options: op.opciones,
        );
        return true;
      case TipoOperacionOffline.eliminar:
        try {
          await apiClient.dio.delete<void>(op.rutaPeticion);
          return true;
        } on DioException catch (e) {
          // Si ya no existe en el servidor (404), el borrado ya se cumplió.
          if (e.response?.statusCode == 404) return false;
          rethrow;
        }
      case TipoOperacionOffline.actualizar:
        if (op.baseServidor != null && op.entidadId != null) {
          final estado = await _comprobarConflictoServidor(op);
          if (estado == _EstadoConflicto.eliminadaEnServidor) {
            _conflictos.add(
              ConflictoSincronizacion(
                usuarioId: op.usuarioId,
                ruta: op.ruta,
                entidadId: op.entidadId!,
                titulo: op.titulo,
                eliminadaEnServidor: true,
              ),
            );
            return false;
          }
          if (estado == _EstadoConflicto.versionMasNueva) {
            // Política: gana el último cambio y se avisa al usuario.
            _conflictos.add(
              ConflictoSincronizacion(
                usuarioId: op.usuarioId,
                ruta: op.ruta,
                entidadId: op.entidadId!,
                titulo: op.titulo,
              ),
            );
          }
        }
        await apiClient.dio.put<dynamic>(op.rutaPeticion, data: op.datos);
        return true;
    }
  }

  Future<_EstadoConflicto> _comprobarConflictoServidor(
    OperacionPendiente op,
  ) async {
    try {
      final res = await apiClient.dio.get<Map<String, dynamic>>(
        op.rutaPeticion,
      );
      final actual = res.data;
      final base = op.baseServidor;
      if (actual == null || base == null) return _EstadoConflicto.sinConflicto;
      for (final entrada in base.entries) {
        if (!_valoresIguales(actual[entrada.key], entrada.value)) {
          return _EstadoConflicto.versionMasNueva;
        }
      }
      return _EstadoConflicto.sinConflicto;
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        return _EstadoConflicto.eliminadaEnServidor;
      }
      rethrow;
    }
  }

  static bool _valoresIguales(Object? a, Object? b) {
    if (a is List && b is List) {
      if (a.length != b.length) return false;
      for (var i = 0; i < a.length; i++) {
        if (!_valoresIguales(a[i], b[i])) return false;
      }
      return true;
    }
    return a == b;
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

enum _EstadoConflicto { sinConflicto, versionMasNueva, eliminadaEnServidor }
