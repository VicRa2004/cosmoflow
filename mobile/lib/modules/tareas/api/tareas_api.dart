import 'dart:async';

import '../../../core/api/api_client.dart';
import '../../../core/notificaciones/recordatorios_service.dart';
import '../../../core/offline/cola_sin_conexion.dart';
import '../models/estadisticas_tareas_model.dart';
import '../models/tarea_model.dart';

/// Cliente de API para `/api/tareas` y `/api/tareas/pendientes`.
class TareasApi {
  const TareasApi({required this.apiClient, this.cola, this.recordatorios});

  final ApiClient apiClient;

  /// Con ella, crear sin red guarda la tarea para sincronizarla después.
  final ColaSinConexion? cola;

  /// Reprograma o cancela recordatorios locales al crear, editar o eliminar tareas.
  final RecordatoriosService? recordatorios;

  /// Obtiene las tareas pendientes ordenadas por vencimiento (`GET /api/tareas/pendientes`).
  Future<PaginaTareas> obtenerPendientes({
    int pagina = 1,
    int limite = 25,
  }) async {
    final response = await apiClient.dio.get<Map<String, dynamic>>(
      '/tareas/pendientes',
      queryParameters: <String, dynamic>{'pagina': pagina, 'limite': limite},
    );
    return PaginaTareas.fromJson(response.data ?? const <String, dynamic>{});
  }

  /// Obtiene el listado de tareas con filtros (`GET /api/tareas`).
  Future<PaginaTareas> obtenerTodos({
    int pagina = 1,
    int limite = 25,
    String? busqueda,
    EstadoTarea? estado,
    bool asignadas = false,
    int? tagId,
    int? organizacionId,
    int? equipoId,
    int? proyectoId,
  }) async {
    final query = <String, dynamic>{'pagina': pagina, 'limite': limite};
    if (busqueda != null && busqueda.trim().isNotEmpty) {
      query['busqueda'] = busqueda.trim();
    }
    if (estado != null) {
      query['estado'] = estado.valorApi;
    }
    if (asignadas) {
      query['asignadas'] = true;
    }
    if (tagId != null) {
      query['tagId'] = tagId;
    }
    if (proyectoId != null) {
      query['proyectoId'] = proyectoId;
    } else if (equipoId != null) {
      query['equipoId'] = equipoId;
    } else if (organizacionId != null) {
      query['organizacionId'] = organizacionId;
    }

    final response = await apiClient.dio.get<Map<String, dynamic>>(
      '/tareas',
      queryParameters: query,
    );
    return PaginaTareas.fromJson(response.data ?? const <String, dynamic>{});
  }

  /// Crea una tarea nueva (`POST /api/tareas`).
  /// `null`: sin conexión, quedó en la cola y se enviará al recuperarla.
  Future<TareaDto?> crear({
    required String titulo,
    String contenido = '',
    EstadoTarea estado = EstadoTarea.pendiente,
    PrioridadTarea prioridad = PrioridadTarea.media,
    String? fechaInicio,
    String? fechaVencimiento,
    String? color,
    List<int> tagIds = const <int>[],
    List<int> responsableIds = const <int>[],
    List<SubtareaDto> subtareas = const <SubtareaDto>[],
    int? organizacionId,
    int? equipoId,
    int? proyectoId,
  }) async {
    final datos = <String, dynamic>{
      'titulo': titulo.trim(),
      'contenido': contenido,
      'estado': estado.valorApi,
      'prioridad': prioridad.valorApi,
      'fechaInicio': (fechaInicio != null && fechaInicio.isNotEmpty)
          ? fechaInicio
          : null,
      'fechaVencimiento':
          (fechaVencimiento != null && fechaVencimiento.isNotEmpty)
          ? fechaVencimiento
          : null,
      'color': (color != null && color.isNotEmpty) ? color : null,
      'tagIds': tagIds,
      'responsableIds': responsableIds,
      'subtareas': subtareas.map((s) => s.toJson()).toList(growable: false),
      if (proyectoId != null)
        'proyectoId': proyectoId
      else if (equipoId != null)
        'equipoId': equipoId
      else
        'organizacionId': ?organizacionId,
    };
    final respuesta = cola == null
        ? (await apiClient.dio.post<Map<String, dynamic>>(
            '/tareas',
            data: datos,
          )).data
        : await cola!.crearOEncolar('/tareas', datos);
    if (respuesta == null) return null;
    final tarea = TareaDto.fromJson(respuesta);
    if (recordatorios != null) {
      unawaited(recordatorios!.actualizarTarea(tarea));
    }
    return tarea;
  }

  /// Tareas con vencimiento (o inicio) entre dos días AAAA-MM-DD (`GET /api/tareas/calendario`).
  Future<List<TareaDto>> calendario(String desde, String hasta) async {
    final response = await apiClient.dio.get<List<dynamic>>(
      '/tareas/calendario',
      queryParameters: <String, dynamic>{'desde': desde, 'hasta': hasta},
    );
    return (response.data ?? const <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .map(TareaDto.fromJson)
        .toList(growable: false);
  }

  /// Una tarea por id (`GET /api/tareas/{id}`).
  Future<TareaDto> obtenerUno(int id) async {
    final response = await apiClient.dio.get<Map<String, dynamic>>(
      '/tareas/$id',
    );
    return TareaDto.fromJson(response.data!);
  }

  static Map<String, dynamic> _snapshotTarea(TareaDto tarea) =>
      <String, dynamic>{
        'titulo': tarea.titulo,
        'contenido': tarea.contenido,
        'estado': tarea.estado.valorApi,
        'prioridad': tarea.prioridad.valorApi,
        'fechaInicio': tarea.fechaInicio,
        'fechaVencimiento': tarea.fechaVencimiento,
        'color': tarea.color,
      };

  /// Actualiza campos de una tarea existente (`PUT /api/tareas/{id}`).
  /// Devuelve `null` si sin conexión quedó en la cola para subirla después.
  Future<TareaDto?> actualizar(
    int id,
    Map<String, dynamic> datos, {
    TareaDto? base,
  }) async {
    final respuesta = cola == null
        ? (await apiClient.dio.put<Map<String, dynamic>>(
            '/tareas/$id',
            data: datos,
          )).data
        : await cola!.actualizarOEncolar(
            '/tareas',
            id,
            datos,
            titulo: base?.titulo ?? datos['titulo'] as String?,
            baseServidor: base != null ? _snapshotTarea(base) : null,
          );
    if (respuesta == null) return null;
    final tarea = TareaDto.fromJson(respuesta);
    if (recordatorios != null) {
      unawaited(recordatorios!.actualizarTarea(tarea));
    }
    return tarea;
  }

  /// Alterna entre `completada` y `pendiente` (acción de `BotonCompletar`).
  /// Devuelve `null` si quedó encolada sin conexión.
  Future<TareaDto?> alternarCompletada(TareaDto tarea) {
    final nuevoEstado = tarea.estado == EstadoTarea.completada
        ? EstadoTarea.pendiente
        : EstadoTarea.completada;
    return actualizar(tarea.id, <String, dynamic>{
      'estado': nuevoEstado.valorApi,
    }, base: tarea);
  }

  /// Recuento de tareas por destino (`GET /api/tareas/estadisticas`).
  Future<EstadisticasTareasDto> obtenerEstadisticas({
    int? organizacionId,
    int? equipoId,
    int? proyectoId,
  }) async {
    final query = <String, dynamic>{
      if (proyectoId != null)
        'proyectoId': proyectoId
      else if (equipoId != null)
        'equipoId': equipoId
      else
        'organizacionId': ?organizacionId,
    };
    final response = await apiClient.dio.get<Map<String, dynamic>>(
      '/tareas/estadisticas',
      queryParameters: query,
    );
    return EstadisticasTareasDto.fromJson(
      response.data ?? const <String, dynamic>{},
    );
  }

  /// Elimina una tarea (`DELETE /api/tareas/{id}`).
  /// Devuelve `true` si se borró en el servidor o `false` si quedó encolada.
  Future<bool> eliminar(int id, {String? titulo}) async {
    final borrada = cola == null
        ? (await apiClient.dio.delete<void>('/tareas/$id'), true).$2
        : await cola!.eliminarOEncolar('/tareas', id, titulo: titulo);
    if (recordatorios != null) {
      unawaited(recordatorios!.cancelarTarea(id));
    }
    return borrada;
  }

  /// Aplica cambios pendientes de la cola (ediciones/completados/borrados) sobre
  /// una lista en memoria para reflejarlos al instante en la interfaz.
  List<TareaDto> aplicarPendientes(int? usuarioId, List<TareaDto> tareas) {
    final c = cola;
    if (c == null || usuarioId == null) return tareas;
    final resultado = <TareaDto>[];
    for (final tarea in tareas) {
      if (c.estaEliminadaPendiente(usuarioId, '/tareas', tarea.id)) continue;
      resultado.add(aplicarPendiente(usuarioId, tarea));
    }
    return resultado;
  }

  /// Aplica cambios pendientes de la cola a una tarea concreta.
  TareaDto aplicarPendiente(int? usuarioId, TareaDto tarea) {
    final c = cola;
    if (c == null || usuarioId == null) return tarea;
    final cambios = c.cambiosPendientes(usuarioId, '/tareas', tarea.id);
    if (cambios == null || cambios.isEmpty) return tarea;
    List<int> parseIds(Object? valor, List<int> actual) {
      if (valor is List) {
        return valor.whereType<num>().map((e) => e.toInt()).toList();
      }
      return actual;
    }

    final rawSubtareas = cambios['subtareas'];
    final subtareas = rawSubtareas is List
        ? rawSubtareas
              .whereType<Map<String, dynamic>>()
              .map(SubtareaDto.fromJson)
              .toList(growable: false)
        : tarea.subtareas;

    return TareaDto(
      id: tarea.id,
      titulo: cambios['titulo'] as String? ?? tarea.titulo,
      contenido: cambios['contenido'] as String? ?? tarea.contenido,
      estado: cambios.containsKey('estado')
          ? EstadoTarea.fromValorApi(cambios['estado'] as String?)
          : tarea.estado,
      prioridad: cambios.containsKey('prioridad')
          ? PrioridadTarea.fromValorApi(cambios['prioridad'] as String?)
          : tarea.prioridad,
      fechaInicio: cambios.containsKey('fechaInicio')
          ? cambios['fechaInicio'] as String?
          : tarea.fechaInicio,
      fechaVencimiento: cambios.containsKey('fechaVencimiento')
          ? cambios['fechaVencimiento'] as String?
          : tarea.fechaVencimiento,
      color: cambios.containsKey('color')
          ? cambios['color'] as String?
          : tarea.color,
      tagIds: cambios.containsKey('tagIds')
          ? parseIds(cambios['tagIds'], tarea.tagIds)
          : tarea.tagIds,
      responsableIds: cambios.containsKey('responsableIds')
          ? parseIds(cambios['responsableIds'], tarea.responsableIds)
          : tarea.responsableIds,
      subtareas: subtareas,
      organizacionId: tarea.organizacionId,
      equipoId: tarea.equipoId,
      proyectoId: tarea.proyectoId,
    );
  }
}
