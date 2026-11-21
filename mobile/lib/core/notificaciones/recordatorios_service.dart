import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../modules/notificaciones/api/notificaciones_api.dart';
import '../../modules/tareas/models/tarea_model.dart';
import '../api/api_client.dart';
import 'notificaciones_locales.dart';

/// Momento del recordatorio local respecto a las fechas de la tarea.
enum TipoRecordatorio { inicio, venceManana, venceHoy }

/// Recordatorio local listo para programar en el dispositivo.
class RecordatorioProgramado {
  const RecordatorioProgramado({
    required this.id,
    required this.tareaId,
    required this.tipo,
    required this.fechaLocal,
    required this.titulo,
    required this.cuerpo,
    required this.payload,
  });

  final int id;
  final int tareaId;
  final TipoRecordatorio tipo;
  final DateTime fechaLocal;
  final String titulo;
  final String cuerpo;
  final String payload;
}

typedef ProgramarRecordatorioCallback = Future<void> Function(
  RecordatorioProgramado recordatorio,
);

/// Programa recordatorios locales de inicio y vencimiento de tareas para que
/// avisen aunque el dispositivo no tenga conexión.
///
/// Se coordina con las notificaciones push del servidor (`AvisarVencimientos`):
/// si el usuario tiene push móvil activo para el evento `vencimiento`, omite
/// los recordatorios locales de vencimiento para no avisar dos veces de lo mismo
/// y mantiene solo los de fecha de inicio (que el backend no envía por push).
class RecordatoriosService {
  RecordatoriosService({
    required this.apiClient,
    NotificacionesApi? notificacionesApi,
    this.notificacionesLocales,
    this.intervaloMinimoSincronizacion = const Duration(minutes: 5),
    this.cargarPendientes,
    this.solicitarPermiso,
    this.programar,
    this.cancelar,
    this.idsPendientes,
    DateTime Function()? ahora,
  }) : _notificacionesApi =
           notificacionesApi ?? NotificacionesApi(apiClient: apiClient),
       _ahora = ahora ?? DateTime.now;

  /// Hora local de aviso (8:00 AM, alineada con `AvisarVencimientos` del backend).
  static const int horaAviso = 8;

  /// Ventana máxima hacia adelante para programar recordatorios locales.
  static const int horizonteDias = 30;

  /// Tope seguro por debajo del límite de 64 notificaciones pendientes de iOS.
  static const int maxRecordatorios = 50;

  /// Rango de IDs reservado para recordatorios locales (evita colisión con push).
  static const int idBase = 1000000;

  final ApiClient apiClient;
  final NotificacionesApi _notificacionesApi;
  final NotificacionesLocales? notificacionesLocales;
  final Duration intervaloMinimoSincronizacion;
  final Future<List<TareaDto>> Function()? cargarPendientes;
  final Future<void> Function()? solicitarPermiso;
  final ProgramarRecordatorioCallback? programar;
  final Future<void> Function(int id)? cancelar;
  final Future<List<int>> Function()? idsPendientes;
  final DateTime Function() _ahora;

  bool _sincronizando = false;
  bool _sesionSincronizada = false;
  bool _pushVencimientoActivo = false;
  DateTime? _ultimaSincronizacion;

  /// Indica si el último chequeo detectó push móvil activo para vencimientos.
  bool get pushVencimientoActivo => _pushVencimientoActivo;

  /// ID determinista para cada combinación `(tareaId, tipo)`.
  static int idPara(int tareaId, TipoRecordatorio tipo) =>
      idBase + tareaId * 4 + tipo.index;

  /// Identifica si un ID de notificación pertenece a este servicio.
  static bool esIdRecordatorio(int id) => id >= idBase;

  /// Todos los posibles IDs de recordatorio asociados a una tarea.
  static List<int> idsDeTarea(int tareaId) => <int>[
    idPara(tareaId, TipoRecordatorio.inicio),
    idPara(tareaId, TipoRecordatorio.venceManana),
    idPara(tareaId, TipoRecordatorio.venceHoy),
  ];

  /// Parsea `AAAA-MM-DD` (o un prefijo ISO) a fecha local sin hora.
  static DateTime? parsearFecha(String? valor) {
    if (valor == null) return null;
    final limpio = valor.trim();
    if (limpio.length < 10) return null;
    final partes = limpio.substring(0, 10).split('-');
    if (partes.length != 3) return null;
    final anio = int.tryParse(partes[0]);
    final mes = int.tryParse(partes[1]);
    final dia = int.tryParse(partes[2]);
    if (anio == null || mes == null || dia == null) return null;
    return DateTime(anio, mes, dia);
  }

  /// Construye los recordatorios locales vigentes para una sola tarea.
  static List<RecordatorioProgramado> construirRecordatoriosDeTarea(
    TareaDto tarea, {
    required DateTime ahora,
    required bool incluirVencimiento,
  }) {
    if (!tarea.estado.isAbierta) return const <RecordatorioProgramado>[];

    final limite = ahora.add(const Duration(days: horizonteDias));
    final inicio = parsearFecha(tarea.fechaInicio);
    final vencimiento = parsearFecha(tarea.fechaVencimiento);
    final resultado = <RecordatorioProgramado>[];
    final payload = '/tareas/${tarea.id}';

    bool dentroDeVentana(DateTime fecha) =>
        fecha.isAfter(ahora) && !fecha.isAfter(limite);

    // Si la tarea inicia y vence el mismo día, priorizamos el aviso de vencimiento
    // para no disparar dos notificaciones simultáneas a las 8:00 AM.
    final mismoDiaInicioYVencimiento =
        inicio != null &&
        vencimiento != null &&
        inicio.year == vencimiento.year &&
        inicio.month == vencimiento.month &&
        inicio.day == vencimiento.day;

    if (inicio != null && !mismoDiaInicioYVencimiento) {
      final fechaAviso = DateTime(
        inicio.year,
        inicio.month,
        inicio.day,
        horaAviso,
      );
      if (dentroDeVentana(fechaAviso)) {
        resultado.add(
          RecordatorioProgramado(
            id: idPara(tarea.id, TipoRecordatorio.inicio),
            tareaId: tarea.id,
            tipo: TipoRecordatorio.inicio,
            fechaLocal: fechaAviso,
            titulo: '«${tarea.titulo}» inicia hoy',
            cuerpo:
                'La tarea «${tarea.titulo}» inicia hoy (${tarea.fechaInicio}).',
            payload: payload,
          ),
        );
      }
    }

    if (incluirVencimiento && vencimiento != null) {
      final vispera = DateTime(
        vencimiento.year,
        vencimiento.month,
        vencimiento.day - 1,
        horaAviso,
      );
      if (dentroDeVentana(vispera)) {
        resultado.add(
          RecordatorioProgramado(
            id: idPara(tarea.id, TipoRecordatorio.venceManana),
            tareaId: tarea.id,
            tipo: TipoRecordatorio.venceManana,
            fechaLocal: vispera,
            titulo: '«${tarea.titulo}» vence mañana',
            cuerpo:
                'La tarea «${tarea.titulo}» vence mañana (${tarea.fechaVencimiento}).',
            payload: payload,
          ),
        );
      }

      final mismoDia = DateTime(
        vencimiento.year,
        vencimiento.month,
        vencimiento.day,
        horaAviso,
      );
      if (dentroDeVentana(mismoDia)) {
        resultado.add(
          RecordatorioProgramado(
            id: idPara(tarea.id, TipoRecordatorio.venceHoy),
            tareaId: tarea.id,
            tipo: TipoRecordatorio.venceHoy,
            fechaLocal: mismoDia,
            titulo: '«${tarea.titulo}» vence hoy',
            cuerpo:
                'La tarea «${tarea.titulo}» vence hoy (${tarea.fechaVencimiento}).',
            payload: payload,
          ),
        );
      }
    }

    return resultado;
  }

  /// Ordena cronológicamente y limita el lote respetando el tope de iOS.
  static List<RecordatorioProgramado> construirPlan(
    List<TareaDto> tareas, {
    required DateTime ahora,
    required bool incluirVencimiento,
  }) {
    final todos = <RecordatorioProgramado>[
      for (final tarea in tareas)
        ...construirRecordatoriosDeTarea(
          tarea,
          ahora: ahora,
          incluirVencimiento: incluirVencimiento,
        ),
    ]..sort((a, b) => a.fechaLocal.compareTo(b.fechaLocal));

    if (todos.length <= maxRecordatorios) return todos;
    return todos.sublist(0, maxRecordatorios);
  }

  /// Suscribe el servicio al estado de sesión para pedir permiso al entrar y
  /// limpiar recordatorios al cerrar sesión.
  void iniciar() {
    apiClient.sesionStore.addListener(_onCambioSesion);
    _onCambioSesion();
  }

  void _onCambioSesion() {
    final sesion = apiClient.sesionStore;
    if (sesion.accessToken != null && !_sesionSincronizada) {
      _sesionSincronizada = true;
      unawaited(sincronizar(forzar: true));
    } else if (sesion.usuario == null) {
      _sesionSincronizada = false;
      _ultimaSincronizacion = null;
      _pushVencimientoActivo = false;
      unawaited(cancelarTodos());
    }
  }

  /// Sincroniza los recordatorios locales con las tareas pendientes del usuario.
  Future<void> sincronizar({bool forzar = false}) async {
    final sesion = apiClient.sesionStore;
    if (!sesion.isAutenticado || sesion.sinConexion || _sincronizando) return;

    final ahora = _ahora();
    if (!forzar &&
        _ultimaSincronizacion != null &&
        ahora.difference(_ultimaSincronizacion!) <
            intervaloMinimoSincronizacion) {
      return;
    }

    _sincronizando = true;
    try {
      await _pedirPermiso();
      await _actualizarEstadoPushVencimiento();

      final tareas = await _obtenerPendientes();
      final plan = construirPlan(
        tareas,
        ahora: ahora,
        incluirVencimiento: !_pushVencimientoActivo,
      );

      final idsDeseados = plan.map((r) => r.id).toSet();
      final existentes = await _obtenerIdsPendientes();
      for (final id in existentes) {
        if (esIdRecordatorio(id) && !idsDeseados.contains(id)) {
          await _cancelarId(id);
        }
      }

      for (final recordatorio in plan) {
        await _programarUno(recordatorio);
      }

      _ultimaSincronizacion = ahora;
    } catch (e) {
      debugPrint('No se pudieron sincronizar recordatorios locales: $e');
    } finally {
      _sincronizando = false;
    }
  }

  /// Reprograma o cancela los recordatorios locales de una tarea puntual
  /// cuando se crea, edita o cambia de estado.
  Future<void> actualizarTarea(TareaDto tarea) async {
    try {
      await cancelarTarea(tarea.id);
      if (!tarea.estado.isAbierta) return;
      final avisos = construirRecordatoriosDeTarea(
        tarea,
        ahora: _ahora(),
        incluirVencimiento: !_pushVencimientoActivo,
      );
      for (final aviso in avisos) {
        await _programarUno(aviso);
      }
    } catch (e) {
      debugPrint('No se pudieron actualizar recordatorios de #${tarea.id}: $e');
    }
  }

  /// Cancela todos los recordatorios locales asociados a una tarea eliminada.
  Future<void> cancelarTarea(int tareaId) async {
    try {
      for (final id in idsDeTarea(tareaId)) {
        await _cancelarId(id);
      }
    } catch (e) {
      debugPrint('No se pudieron cancelar recordatorios de #$tareaId: $e');
    }
  }

  /// Cancela todos los recordatorios locales programados (p. ej. al cerrar sesión).
  Future<void> cancelarTodos() async {
    try {
      final existentes = await _obtenerIdsPendientes();
      for (final id in existentes) {
        if (esIdRecordatorio(id)) {
          await _cancelarId(id);
        }
      }
    } catch (e) {
      debugPrint('No se pudieron limpiar los recordatorios locales: $e');
    }
  }

  Future<void> _actualizarEstadoPushVencimiento() async {
    try {
      final movil = await _notificacionesApi.estadoMovil();
      if (!movil.disponible || movil.dispositivos == 0) {
        _pushVencimientoActivo = false;
        return;
      }
      final preferencias = await _notificacionesApi.obtenerPreferencias();
      _pushVencimientoActivo = preferencias.any(
        (p) => p.evento == 'vencimiento' && p.canal == 'movil' && p.activo,
      );
    } catch (_) {
      // Sin red o error puntual: conservamos el último estado conocido.
    }
  }

  Future<List<TareaDto>> _obtenerPendientes() async {
    if (cargarPendientes != null) return cargarPendientes!();
    final response = await apiClient.dio.get<Map<String, dynamic>>(
      '/tareas/pendientes',
      queryParameters: const <String, dynamic>{'pagina': 1, 'limite': 50},
    );
    return PaginaTareas.fromJson(response.data ?? const <String, dynamic>{})
        .datos;
  }

  Future<void> _pedirPermiso() async {
    if (solicitarPermiso != null) {
      await solicitarPermiso!();
      return;
    }
    await notificacionesLocales?.solicitarPermiso();
  }

  Future<void> _programarUno(RecordatorioProgramado recordatorio) async {
    if (programar != null) {
      await programar!(recordatorio);
      return;
    }
    await notificacionesLocales?.programarRecordatorio(
      id: recordatorio.id,
      titulo: recordatorio.titulo,
      cuerpo: recordatorio.cuerpo,
      fechaLocal: recordatorio.fechaLocal,
      payload: recordatorio.payload,
    );
  }

  Future<void> _cancelarId(int id) async {
    if (cancelar != null) {
      await cancelar!(id);
      return;
    }
    await notificacionesLocales?.cancelar(id);
  }

  Future<List<int>> _obtenerIdsPendientes() async {
    if (idsPendientes != null) return idsPendientes!();
    return await notificacionesLocales?.idsPendientes() ?? const <int>[];
  }

  void dispose() {
    apiClient.sesionStore.removeListener(_onCambioSesion);
  }
}
