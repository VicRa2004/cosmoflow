import '../../../core/api/api_client.dart';
import '../models/busqueda_models.dart';

/// Cliente de API para búsqueda global (`GET /api/busqueda`).
class BusquedaApi {
  const BusquedaApi({required this.apiClient});

  final ApiClient apiClient;

  /// Busca en tareas, notas, proyectos y equipos (mínimo 2 caracteres).
  Future<ResultadosBusquedaDto> buscar(String consulta) async {
    final response = await apiClient.dio.get<Map<String, dynamic>>(
      '/busqueda',
      queryParameters: <String, dynamic>{'q': consulta.trim()},
    );
    return ResultadosBusquedaDto.fromJson(
      response.data ?? const <String, dynamic>{},
    );
  }
}
