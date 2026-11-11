import '../../../core/api/api_client.dart';
import '../models/tag_model.dart';

/// Cliente de API para `/api/tags` y `/api/organizaciones/{id}/tags`.
class TagsApi {
  const TagsApi({required this.apiClient});

  final ApiClient apiClient;

  String _rutaBase(int? organizacionId) =>
      organizacionId != null ? '/organizaciones/$organizacionId/tags' : '/tags';

  /// Obtiene las etiquetas personales o de una organización.
  Future<PaginaTags> obtenerTodos({
    int pagina = 1,
    int limite = 50,
    String? nombre,
    int? organizacionId,
  }) async {
    final query = <String, dynamic>{'pagina': pagina, 'limite': limite};
    if (nombre != null && nombre.trim().isNotEmpty) {
      query['nombre'] = nombre.trim();
    }

    final response = await apiClient.dio.get<Map<String, dynamic>>(
      _rutaBase(organizacionId),
      queryParameters: query,
    );
    return PaginaTags.fromJson(response.data ?? const <String, dynamic>{});
  }

  /// Crea una nueva etiqueta (`POST /api/tags` o `/api/organizaciones/{id}/tags`).
  Future<TagDto> crear({
    required String nombre,
    String? color,
    int? organizacionId,
  }) async {
    final response = await apiClient.dio.post<Map<String, dynamic>>(
      _rutaBase(organizacionId),
      data: <String, dynamic>{
        'nombre': nombre.trim(),
        'color': (color != null && color.isNotEmpty) ? color : null,
      },
    );
    return TagDto.fromJson(response.data!);
  }

  /// Actualiza una etiqueta existente (`PUT .../tags/{id}`).
  Future<TagDto> actualizar(
    int id, {
    required String nombre,
    String? color,
    int? organizacionId,
  }) async {
    final response = await apiClient.dio.put<Map<String, dynamic>>(
      '${_rutaBase(organizacionId)}/$id',
      data: <String, dynamic>{
        'nombre': nombre.trim(),
        'color': (color != null && color.isNotEmpty) ? color : null,
      },
    );
    return TagDto.fromJson(response.data!);
  }

  /// Elimina una etiqueta (`DELETE .../tags/{id}`).
  Future<void> eliminar(int id, {int? organizacionId}) async {
    await apiClient.dio.delete<void>('${_rutaBase(organizacionId)}/$id');
  }
}
