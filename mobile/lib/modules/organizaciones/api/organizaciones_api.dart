import '../../../core/api/api_client.dart';
import '../models/organizacion_models.dart';

/// Cliente de API para `/api/organizaciones` y sus recursos de lectura
/// (miembros, equipos y proyectos).
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
}
