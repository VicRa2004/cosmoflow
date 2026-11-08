import '../../../core/api/api_client.dart';
import '../../../core/offline/cola_sin_conexion.dart';
import '../models/carpeta_model.dart';
import '../models/nota_model.dart';

/// Cliente de API para `/api/notas` y `/api/carpetas`.
class NotasApi {
  const NotasApi({required this.apiClient, this.cola});

  final ApiClient apiClient;

  /// Con ella, crear sin red guarda la nota para sincronizarla después.
  final ColaSinConexion? cola;

  /// Obtiene las notas personales con búsqueda y filtros (`GET /api/notas`).
  Future<PaginaNotas> obtenerTodos({
    int pagina = 1,
    int limite = 25,
    String? busqueda,
    int? tagId,
    int? carpetaId,
  }) async {
    final query = <String, dynamic>{'pagina': pagina, 'limite': limite};
    if (busqueda != null && busqueda.trim().isNotEmpty) {
      query['busqueda'] = busqueda.trim();
    }
    if (tagId != null) {
      query['tagId'] = tagId;
    }
    if (carpetaId != null) {
      query['carpetaId'] = carpetaId;
    }

    final response = await apiClient.dio.get<Map<String, dynamic>>(
      '/notas',
      queryParameters: query,
    );
    return PaginaNotas.fromJson(response.data ?? const <String, dynamic>{});
  }

  /// Carpetas personales, por nombre (`GET /api/carpetas`).
  Future<List<CarpetaDto>> obtenerCarpetas() async {
    final response = await apiClient.dio.get<List<dynamic>>('/carpetas');
    return (response.data ?? const <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .map(CarpetaDto.fromJson)
        .toList(growable: false);
  }

  /// Crea una nota nueva (`POST /api/notas`). `null`: sin conexión, quedó en
  /// la cola y se enviará al recuperarla.
  Future<NotaDto?> crear({
    required String titulo,
    String contenido = '',
    String? color,
    List<int> tagIds = const <int>[],
    int? carpetaId,
  }) async {
    final datos = <String, dynamic>{
      'titulo': titulo.trim(),
      'contenido': contenido,
      'color': (color != null && color.isNotEmpty) ? color : null,
      'tagIds': tagIds,
      'carpetaId': carpetaId,
    };
    final respuesta = cola == null
        ? (await apiClient.dio.post<Map<String, dynamic>>(
            '/notas',
            data: datos,
          )).data
        : await cola!.crearOEncolar('/notas', datos);
    return respuesta == null ? null : NotaDto.fromJson(respuesta);
  }

  /// Actualiza una nota existente (`PUT /api/notas/{id}`).
  Future<NotaDto> actualizar(
    int id, {
    required String titulo,
    required String contenido,
    String? color,
    List<int> tagIds = const <int>[],
    int? carpetaId,
  }) async {
    final response = await apiClient.dio.put<Map<String, dynamic>>(
      '/notas/$id',
      data: <String, dynamic>{
        'titulo': titulo.trim(),
        'contenido': contenido,
        'color': (color != null && color.isNotEmpty) ? color : null,
        'tagIds': tagIds,
        'carpetaId': carpetaId,
      },
    );
    return NotaDto.fromJson(response.data!);
  }

  /// Elimina una nota (`DELETE /api/notas/{id}`).
  Future<void> eliminar(int id) async {
    await apiClient.dio.delete<void>('/notas/$id');
  }
}
