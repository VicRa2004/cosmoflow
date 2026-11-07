import '../../../core/api/api_client.dart';
import '../models/tarea_model.dart';

/// Cliente de API para `/api/tareas` y `/api/tareas/pendientes`.
class TareasApi {
  const TareasApi({required this.apiClient});

  final ApiClient apiClient;

  /// Obtiene las tareas pendientes ordenadas por vencimiento (`GET /api/tareas/pendientes`).
  Future<PaginaTareas> obtenerPendientes({
    int pagina = 1,
    int limite = 25,
  }) async {
    final response = await apiClient.dio.get<Map<String, dynamic>>(
      '/tareas/pendientes',
      queryParameters: <String, dynamic>{
        'pagina': pagina,
        'limite': limite,
      },
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
  }) async {
    final query = <String, dynamic>{
      'pagina': pagina,
      'limite': limite,
    };
    if (busqueda != null && busqueda.trim().isNotEmpty) {
      query['busqueda'] = busqueda.trim();
    }
    if (estado != null) {
      query['estado'] = estado.valorApi;
    }
    if (asignadas) {
      query['asignadas'] = true;
    }

    final response = await apiClient.dio.get<Map<String, dynamic>>(
      '/tareas',
      queryParameters: query,
    );
    return PaginaTareas.fromJson(response.data ?? const <String, dynamic>{});
  }

  /// Crea una tarea nueva (`POST /api/tareas`).
  Future<TareaDto> crear({
    required String titulo,
    String contenido = '',
    EstadoTarea estado = EstadoTarea.pendiente,
    PrioridadTarea prioridad = PrioridadTarea.media,
    String? fechaInicio,
    String? fechaVencimiento,
    String? color,
  }) async {
    final response = await apiClient.dio.post<Map<String, dynamic>>(
      '/tareas',
      data: <String, dynamic>{
        'titulo': titulo.trim(),
        'contenido': contenido,
        'estado': estado.valorApi,
        'prioridad': prioridad.valorApi,
        'fechaInicio':
            (fechaInicio != null && fechaInicio.isNotEmpty) ? fechaInicio : null,
        'fechaVencimiento':
            (fechaVencimiento != null && fechaVencimiento.isNotEmpty)
                ? fechaVencimiento
                : null,
        'color': (color != null && color.isNotEmpty) ? color : null,
        'tagIds': const <int>[],
        'responsableIds': const <int>[],
      },
    );
    return TareaDto.fromJson(response.data!);
  }

  /// Actualiza campos de una tarea existente (`PUT /api/tareas/{id}`).
  Future<TareaDto> actualizar(int id, Map<String, dynamic> datos) async {
    final response = await apiClient.dio.put<Map<String, dynamic>>(
      '/tareas/$id',
      data: datos,
    );
    return TareaDto.fromJson(response.data!);
  }

  /// Alterna entre `completada` y `pendiente` (acción de `BotonCompletar`).
  Future<TareaDto> alternarCompletada(TareaDto tarea) {
    final nuevoEstado = tarea.estado == EstadoTarea.completada
        ? EstadoTarea.pendiente
        : EstadoTarea.completada;
    return actualizar(
      tarea.id,
      <String, dynamic>{'estado': nuevoEstado.valorApi},
    );
  }

  /// Elimina una tarea (`DELETE /api/tareas/{id}`).
  Future<void> eliminar(int id) async {
    await apiClient.dio.delete<void>('/tareas/$id');
  }
}
