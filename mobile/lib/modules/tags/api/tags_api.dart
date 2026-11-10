import '../../../core/api/api_client.dart';
import '../models/tag_model.dart';

/// Cliente de API para `/api/tags`.
class TagsApi {
  const TagsApi({required this.apiClient});

  final ApiClient apiClient;

  /// Obtiene las etiquetas personales (`GET /api/tags`).
  Future<PaginaTags> obtenerTodos({
    int pagina = 1,
    int limite = 50,
    String? nombre,
  }) async {
    final query = <String, dynamic>{'pagina': pagina, 'limite': limite};
    if (nombre != null && nombre.trim().isNotEmpty) {
      query['nombre'] = nombre.trim();
    }

    final response = await apiClient.dio.get<Map<String, dynamic>>(
      '/tags',
      queryParameters: query,
    );
    return PaginaTags.fromJson(response.data ?? const <String, dynamic>{});
  }

  /// Crea una nueva etiqueta (`POST /api/tags`).
  Future<TagDto> crear({required String nombre, String? color}) async {
    final response = await apiClient.dio.post<Map<String, dynamic>>(
      '/tags',
      data: <String, dynamic>{
        'nombre': nombre.trim(),
        'color': (color != null && color.isNotEmpty) ? color : null,
      },
    );
    return TagDto.fromJson(response.data!);
  }

  /// Actualiza una etiqueta existente (`PUT /api/tags/{id}`).
  Future<TagDto> actualizar(
    int id, {
    required String nombre,
    String? color,
  }) async {
    final response = await apiClient.dio.put<Map<String, dynamic>>(
      '/tags/$id',
      data: <String, dynamic>{
        'nombre': nombre.trim(),
        'color': (color != null && color.isNotEmpty) ? color : null,
      },
    );
    return TagDto.fromJson(response.data!);
  }

  /// Elimina una etiqueta (`DELETE /api/tags/{id}`).
  Future<void> eliminar(int id) async {
    await apiClient.dio.delete<void>('/tags/$id');
  }
}
