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

  /// Obtiene las notas personales o de un proyecto con búsqueda y filtros (`GET /api/notas`).
  Future<PaginaNotas> obtenerTodos({
    int pagina = 1,
    int limite = 25,
    String? busqueda,
    int? tagId,
    int? carpetaId,
    int? proyectoId,
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
    if (proyectoId != null) {
      query['proyectoId'] = proyectoId;
    }

    final response = await apiClient.dio.get<Map<String, dynamic>>(
      '/notas',
      queryParameters: query,
    );
    return PaginaNotas.fromJson(response.data ?? const <String, dynamic>{});
  }

  /// Carpetas personales o de un proyecto, por nombre (`GET /api/carpetas`).
  Future<List<CarpetaDto>> obtenerCarpetas({int? proyectoId}) async {
    final response = await apiClient.dio.get<List<dynamic>>(
      '/carpetas',
      queryParameters: proyectoId != null
          ? <String, dynamic>{'proyectoId': proyectoId}
          : null,
    );
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
    int? proyectoId,
  }) async {
    final datos = <String, dynamic>{
      'titulo': titulo.trim(),
      'contenido': contenido,
      'color': (color != null && color.isNotEmpty) ? color : null,
      'tagIds': tagIds,
      'carpetaId': carpetaId,
      'proyectoId': ?proyectoId,
    };
    final respuesta = cola == null
        ? (await apiClient.dio.post<Map<String, dynamic>>(
            '/notas',
            data: datos,
          )).data
        : await cola!.crearOEncolar('/notas', datos);
    return respuesta == null ? null : NotaDto.fromJson(respuesta);
  }

  static Map<String, dynamic> _snapshotNota(NotaDto nota) => <String, dynamic>{
    'titulo': nota.titulo,
    'contenido': nota.contenido,
    'color': nota.color,
    'carpetaId': nota.carpetaId,
  };

  /// Actualiza una nota existente (`PUT /api/notas/{id}`).
  /// Devuelve `null` si sin conexión quedó en la cola.
  Future<NotaDto?> actualizar(
    int id, {
    required String titulo,
    required String contenido,
    String? color,
    List<int> tagIds = const <int>[],
    int? carpetaId,
    NotaDto? base,
  }) async {
    final datos = <String, dynamic>{
      'titulo': titulo.trim(),
      'contenido': contenido,
      'color': (color != null && color.isNotEmpty) ? color : null,
      'tagIds': tagIds,
      'carpetaId': carpetaId,
    };
    final respuesta = cola == null
        ? (await apiClient.dio.put<Map<String, dynamic>>(
            '/notas/$id',
            data: datos,
          )).data
        : await cola!.actualizarOEncolar(
            '/notas',
            id,
            datos,
            titulo: titulo.trim(),
            baseServidor: base != null ? _snapshotNota(base) : null,
          );
    return respuesta == null ? null : NotaDto.fromJson(respuesta);
  }

  /// Una nota por id (`GET /api/notas/{id}`).
  Future<NotaDto> obtenerUno(int id) async {
    final response = await apiClient.dio.get<Map<String, dynamic>>(
      '/notas/$id',
    );
    return NotaDto.fromJson(response.data!);
  }

  /// Elimina una nota (`DELETE /api/notas/{id}`).
  /// Devuelve `true` si se borró en el servidor o `false` si quedó encolada.
  Future<bool> eliminar(int id, {String? titulo}) async {
    if (cola == null) {
      await apiClient.dio.delete<void>('/notas/$id');
      return true;
    }
    return cola!.eliminarOEncolar('/notas', id, titulo: titulo);
  }

  /// Aplica ediciones y borrados pendientes sobre una lista de notas en memoria.
  List<NotaDto> aplicarPendientes(int? usuarioId, List<NotaDto> notas) {
    final c = cola;
    if (c == null || usuarioId == null) return notas;
    final resultado = <NotaDto>[];
    for (final nota in notas) {
      if (c.estaEliminadaPendiente(usuarioId, '/notas', nota.id)) continue;
      resultado.add(aplicarPendiente(usuarioId, nota));
    }
    return resultado;
  }

  /// Aplica ediciones pendientes de la cola sobre una nota concreta.
  NotaDto aplicarPendiente(int? usuarioId, NotaDto nota) {
    final c = cola;
    if (c == null || usuarioId == null) return nota;
    final cambios = c.cambiosPendientes(usuarioId, '/notas', nota.id);
    if (cambios == null || cambios.isEmpty) return nota;
    final tagIds = cambios['tagIds'] is List
        ? (cambios['tagIds'] as List)
              .whereType<num>()
              .map((e) => e.toInt())
              .toList()
        : nota.tagIds;
    return NotaDto(
      id: nota.id,
      titulo: cambios['titulo'] as String? ?? nota.titulo,
      contenido: cambios['contenido'] as String? ?? nota.contenido,
      color: cambios.containsKey('color')
          ? cambios['color'] as String?
          : nota.color,
      tagIds: tagIds,
      proyectoId: nota.proyectoId,
      carpetaId: cambios.containsKey('carpetaId')
          ? (cambios['carpetaId'] as num?)?.toInt()
          : nota.carpetaId,
    );
  }
}
