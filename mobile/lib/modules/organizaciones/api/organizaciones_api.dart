import '../../../core/api/api_client.dart';
import '../models/organizacion_models.dart';

/// Cliente de API para `/api/organizaciones`, equipos y proyectos.
class OrganizacionesApi {
  const OrganizacionesApi({required this.apiClient});

  final ApiClient apiClient;

  /// Organizaciones a las que pertenece el usuario (`GET /api/organizaciones`).
  Future<PaginaOrganizaciones> obtenerTodas({
    int pagina = 1,
    int limite = 50,
    String? nombre,
    String orden = 'recientes',
  }) async {
    final query = <String, dynamic>{
      'pagina': pagina,
      'limite': limite,
      'orden': orden,
    };
    if (nombre != null && nombre.trim().isNotEmpty) {
      query['nombre'] = nombre.trim();
    }
    final response = await apiClient.dio.get<Map<String, dynamic>>(
      '/organizaciones',
      queryParameters: query,
    );
    return PaginaOrganizaciones.fromJson(
      response.data ?? const <String, dynamic>{},
    );
  }

  /// Detalle de una organización (`GET /api/organizaciones/{id}`).
  Future<OrganizacionDto> obtenerUna(int id) async {
    final response = await apiClient.dio.get<Map<String, dynamic>>(
      '/organizaciones/$id',
    );
    return OrganizacionDto.fromJson(response.data!);
  }

  /// Crea una organización (`POST /api/organizaciones`).
  Future<OrganizacionDto> crear({
    required String nombre,
    String descripcion = '',
    required String color,
  }) async {
    final response = await apiClient.dio.post<Map<String, dynamic>>(
      '/organizaciones',
      data: <String, dynamic>{
        'nombre': nombre.trim(),
        'descripcion': descripcion.trim(),
        'color': color,
      },
    );
    return OrganizacionDto.fromJson(response.data!);
  }

  /// Actualiza una organización (`PUT /api/organizaciones/{id}`).
  Future<OrganizacionDto> actualizar(
    int id, {
    required String nombre,
    String descripcion = '',
    required String color,
  }) async {
    final response = await apiClient.dio.put<Map<String, dynamic>>(
      '/organizaciones/$id',
      data: <String, dynamic>{
        'nombre': nombre.trim(),
        'descripcion': descripcion.trim(),
        'color': color,
      },
    );
    return OrganizacionDto.fromJson(response.data!);
  }

  /// Elimina una organización (`DELETE /api/organizaciones/{id}`).
  Future<void> eliminar(int id) async {
    await apiClient.dio.delete<void>('/organizaciones/$id');
  }

  /// Miembros de una organización (`GET /api/organizaciones/{id}/miembros`).
  Future<List<MiembroDto>> obtenerMiembros(int organizacionId) async {
    final response = await apiClient.dio.get<List<dynamic>>(
      '/organizaciones/$organizacionId/miembros',
    );
    return (response.data ?? const <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .map(MiembroDto.fromJson)
        .toList(growable: false);
  }

  /// Equipos de una organización (`GET /api/organizaciones/{id}/equipos`).
  Future<List<EquipoDto>> obtenerEquipos(
    int organizacionId, {
    int? tagId,
  }) async {
    final response = await apiClient.dio.get<List<dynamic>>(
      '/organizaciones/$organizacionId/equipos',
      queryParameters: tagId != null ? <String, dynamic>{'tagId': tagId} : null,
    );
    return (response.data ?? const <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .map(EquipoDto.fromJson)
        .toList(growable: false);
  }

  /// Crea un equipo (`POST /api/organizaciones/{id}/equipos`).
  Future<EquipoDto> crearEquipo(
    int organizacionId, {
    required String nombre,
    String descripcion = '',
    required String color,
    required List<int> miembroIds,
    int? liderId,
    List<int> tagIds = const <int>[],
  }) async {
    final response = await apiClient.dio.post<Map<String, dynamic>>(
      '/organizaciones/$organizacionId/equipos',
      data: <String, dynamic>{
        'nombre': nombre.trim(),
        'descripcion': descripcion.trim(),
        'color': color,
        'miembroIds': miembroIds,
        'liderId': liderId,
        'tagIds': tagIds,
      },
    );
    return EquipoDto.fromJson(response.data!);
  }

  /// Actualiza un equipo (`PUT /api/organizaciones/{id}/equipos/{equipoId}`).
  Future<EquipoDto> actualizarEquipo(
    int organizacionId,
    int equipoId, {
    required String nombre,
    String descripcion = '',
    required String color,
    required List<int> miembroIds,
    int? liderId,
    List<int> tagIds = const <int>[],
  }) async {
    final response = await apiClient.dio.put<Map<String, dynamic>>(
      '/organizaciones/$organizacionId/equipos/$equipoId',
      data: <String, dynamic>{
        'nombre': nombre.trim(),
        'descripcion': descripcion.trim(),
        'color': color,
        'miembroIds': miembroIds,
        'liderId': liderId,
        'tagIds': tagIds,
      },
    );
    return EquipoDto.fromJson(response.data!);
  }

  /// Actualiza los delegados de un equipo (`PUT /api/organizaciones/{id}/equipos/{equipoId}/delegados`).
  Future<EquipoDto> actualizarDelegados(
    int organizacionId,
    int equipoId,
    List<int> usuarioIds,
  ) async {
    final response = await apiClient.dio.put<Map<String, dynamic>>(
      '/organizaciones/$organizacionId/equipos/$equipoId/delegados',
      data: <String, dynamic>{'usuarioIds': usuarioIds},
    );
    return EquipoDto.fromJson(response.data!);
  }

  /// Elimina un equipo (`DELETE /api/organizaciones/{id}/equipos/{equipoId}`).
  Future<void> eliminarEquipo(int organizacionId, int equipoId) async {
    await apiClient.dio.delete<void>(
      '/organizaciones/$organizacionId/equipos/$equipoId',
    );
  }

  /// Proyectos de una organización (`GET /api/organizaciones/{id}/proyectos`).
  Future<List<ProyectoDto>> obtenerProyectos(
    int organizacionId, {
    EstadoProyecto? estado,
  }) async {
    final response = await apiClient.dio.get<List<dynamic>>(
      '/organizaciones/$organizacionId/proyectos',
      queryParameters: estado != null
          ? <String, dynamic>{'estado': estado.valorApi}
          : null,
    );
    return (response.data ?? const <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .map(ProyectoDto.fromJson)
        .toList(growable: false);
  }

  /// Crea un proyecto (`POST /api/organizaciones/{id}/proyectos`).
  Future<ProyectoDto> crearProyecto(
    int organizacionId, {
    required String nombre,
    String descripcion = '',
    required EstadoProyecto estado,
    String? color,
    String? fechaInicio,
    String? fechaFin,
    List<int> equipoIds = const <int>[],
    List<int> integranteIds = const <int>[],
  }) async {
    final response = await apiClient.dio.post<Map<String, dynamic>>(
      '/organizaciones/$organizacionId/proyectos',
      data: <String, dynamic>{
        'nombre': nombre.trim(),
        'descripcion': descripcion.trim(),
        'estado': estado.valorApi,
        'color': color,
        'fechaInicio': fechaInicio,
        'fechaFin': fechaFin,
        'equipoIds': equipoIds,
        'integranteIds': integranteIds,
      },
    );
    return ProyectoDto.fromJson(response.data!);
  }

  /// Actualiza un proyecto (`PUT /api/organizaciones/{id}/proyectos/{proyectoId}`).
  Future<ProyectoDto> actualizarProyecto(
    int organizacionId,
    int proyectoId, {
    required String nombre,
    String descripcion = '',
    required EstadoProyecto estado,
    String? color,
    String? fechaInicio,
    String? fechaFin,
    List<int> equipoIds = const <int>[],
    List<int> integranteIds = const <int>[],
  }) async {
    final response = await apiClient.dio.put<Map<String, dynamic>>(
      '/organizaciones/$organizacionId/proyectos/$proyectoId',
      data: <String, dynamic>{
        'nombre': nombre.trim(),
        'descripcion': descripcion.trim(),
        'estado': estado.valorApi,
        'color': color,
        'fechaInicio': fechaInicio,
        'fechaFin': fechaFin,
        'equipoIds': equipoIds,
        'integranteIds': integranteIds,
      },
    );
    return ProyectoDto.fromJson(response.data!);
  }

  /// Elimina un proyecto (`DELETE /api/organizaciones/{id}/proyectos/{proyectoId}`).
  Future<void> eliminarProyecto(int organizacionId, int proyectoId) async {
    await apiClient.dio.delete<void>(
      '/organizaciones/$organizacionId/proyectos/$proyectoId',
    );
  }
}
