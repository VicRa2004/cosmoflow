import '../../../core/api/api_client.dart';
import '../models/nota_model.dart';

/// Cliente de API para `/api/notas`.
class NotasApi {
  const NotasApi({required this.apiClient});

  final ApiClient apiClient;

  /// Obtiene las notas personales con búsqueda y filtro por tag (`GET /api/notas`).
  Future<PaginaNotas> obtenerTodos({
    int pagina = 1,
    int limite = 25,
    String? busqueda,
    int? tagId,
  }) async {
    final query = <String, dynamic>{
      'pagina': pagina,
      'limite': limite,
    };
    if (busqueda != null && busqueda.trim().isNotEmpty) {
      query['busqueda'] = busqueda.trim();
    }
    if (tagId != null) {
      query['tagId'] = tagId;
    }

    final response = await apiClient.dio.get<Map<String, dynamic>>(
      '/notas',
      queryParameters: query,
    );
    return PaginaNotas.fromJson(response.data ?? const <String, dynamic>{});
  }

  /// Crea una nota nueva (`POST /api/notas`).
  Future<NotaDto> crear({
    required String titulo,
    String contenido = '',
    String? color,
    List<int> tagIds = const <int>[],
  }) async {
    final response = await apiClient.dio.post<Map<String, dynamic>>(
      '/notas',
      data: <String, dynamic>{
        'titulo': titulo.trim(),
        'contenido': contenido,
        'color': (color != null && color.isNotEmpty) ? color : null,
        'tagIds': tagIds,
      },
    );
    return NotaDto.fromJson(response.data!);
  }

  /// Actualiza una nota existente (`PUT /api/notas/{id}`).
  Future<NotaDto> actualizar(
    int id, {
    required String titulo,
    required String contenido,
    String? color,
    List<int> tagIds = const <int>[],
  }) async {
    final response = await apiClient.dio.put<Map<String, dynamic>>(
      '/notas/$id',
      data: <String, dynamic>{
        'titulo': titulo.trim(),
        'contenido': contenido,
        'color': (color != null && color.isNotEmpty) ? color : null,
        'tagIds': tagIds,
      },
    );
    return NotaDto.fromJson(response.data!);
  }

  /// Elimina una nota (`DELETE /api/notas/{id}`).
  Future<void> eliminar(int id) async {
    await apiClient.dio.delete<void>('/notas/$id');
  }
}
