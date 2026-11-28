import '../../../core/api/api_client.dart';
import '../../../core/offline/cola_sin_conexion.dart';
import '../models/carpeta_model.dart';
import '../models/nota_model.dart';

/// Cliente de API para `/api/notas`, `/api/carpetas` y preferencia `ordenNotas`.
class NotasApi {
  const NotasApi({required this.apiClient, this.cola});

  final ApiClient apiClient;

  /// Con ella, crear sin red guarda la nota para sincronizarla después.
  final ColaSinConexion? cola;

  /// Obtiene las notas personales o de un proyecto con búsqueda y filtros (`GET /api/notas`).
  Future<PaginaNotas> obtenerTodos({
    int pagina = 1,
    int limite = 100,
    String? busqueda,
    int? tagId,
    int? carpetaId,
    bool? fijada,
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
    if (fijada == true) {
      query['fijada'] = 'true';
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

  /// Carpetas personales o de un proyecto (`GET /api/carpetas`).
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

  /// Crea una carpeta personal o de un proyecto (`POST /api/carpetas`).
  Future<CarpetaDto> crearCarpeta({
    required String nombre,
    String? icono,
    String? color,
    int? padreId,
    int? proyectoId,
  }) async {
    final datos = <String, dynamic>{
      'nombre': nombre.trim(),
      if (icono != null && icono.trim().isNotEmpty) 'icono': icono.trim(),
      if (color != null && color.isNotEmpty) 'color': color,
      'padreId': ?padreId,
      'proyectoId': ?proyectoId,
    };
    final response = await apiClient.dio.post<Map<String, dynamic>>(
      '/carpetas',
      data: datos,
    );
    return CarpetaDto.fromJson(response.data!);
  }

  /// Renombra, cambia color/icono o mueve una carpeta (`PUT /api/carpetas/{id}`).
  Future<CarpetaDto> actualizarCarpeta(
    int id, {
    String? nombre,
    String? icono,
    bool limpiarIcono = false,
    String? color,
    bool limpiarColor = false,
    int? padreId,
    bool actualizarPadre = false,
  }) async {
    final datos = <String, dynamic>{
      if (nombre != null) 'nombre': nombre.trim(),
      if (limpiarIcono)
        'icono': null
      else if (icono != null && icono.trim().isNotEmpty)
        'icono': icono.trim(),
      if (limpiarColor)
        'color': null
      else if (color != null && color.isNotEmpty)
        'color': color,
      if (actualizarPadre) 'padreId': padreId,
    };
    final response = await apiClient.dio.put<Map<String, dynamic>>(
      '/carpetas/$id',
      data: datos,
    );
    return CarpetaDto.fromJson(response.data!);
  }

  /// Elimina una carpeta (`DELETE /api/carpetas/{id}`). Su contenido sube al padre.
  Future<void> eliminarCarpeta(int id) async {
    await apiClient.dio.delete<void>('/carpetas/$id');
  }

  /// Crea una nota nueva (`POST /api/notas`). `null`: sin conexión, quedó en
  /// la cola y se enviará al recuperarla.
  Future<NotaDto?> crear({
    required String titulo,
    String contenido = '',
    String? color,
    bool isFijada = false,
    List<int> tagIds = const <int>[],
    int? carpetaId,
    int? proyectoId,
  }) async {
    final datos = <String, dynamic>{
      'titulo': titulo.trim(),
      'contenido': contenido,
      'color': (color != null && color.isNotEmpty) ? color : null,
      'isFijada': isFijada,
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

  /// Actualiza una nota existente (`PUT /api/notas/{id}`).
  Future<NotaDto> actualizar(
    int id, {
    required String titulo,
    required String contenido,
    String? color,
    bool? isFijada,
    List<int> tagIds = const <int>[],
    int? carpetaId,
  }) async {
    final response = await apiClient.dio.put<Map<String, dynamic>>(
      '/notas/$id',
      data: <String, dynamic>{
        'titulo': titulo.trim(),
        'contenido': contenido,
        'color': (color != null && color.isNotEmpty) ? color : null,
        'isFijada': ?isFijada,
        'tagIds': tagIds,
        'carpetaId': carpetaId,
      },
    );
    return NotaDto.fromJson(response.data!);
  }

  /// Fija o desfija una nota (`PUT /api/notas/{id}`).
  Future<NotaDto> alternarFijada(NotaDto nota) async {
    final response = await apiClient.dio.put<Map<String, dynamic>>(
      '/notas/${nota.id}',
      data: <String, dynamic>{'isFijada': !nota.isFijada},
    );
    return NotaDto.fromJson(response.data!);
  }

  /// Mueve una nota a otra carpeta o a la raíz (`PUT /api/notas/{id}`).
  Future<NotaDto> moverNota(int id, int? carpetaId) async {
    final response = await apiClient.dio.put<Map<String, dynamic>>(
      '/notas/$id',
      data: <String, dynamic>{'carpetaId': carpetaId},
    );
    return NotaDto.fromJson(response.data!);
  }

  /// Duplica una nota en la misma carpeta y ámbito (`POST /api/notas/{id}/duplicar`).
  Future<NotaDto> duplicar(int id) async {
    final response = await apiClient.dio.post<Map<String, dynamic>>(
      '/notas/$id/duplicar',
    );
    return NotaDto.fromJson(response.data!);
  }

  /// Una nota por id (`GET /api/notas/{id}`).
  Future<NotaDto> obtenerUno(int id) async {
    final response = await apiClient.dio.get<Map<String, dynamic>>(
      '/notas/$id',
    );
    return NotaDto.fromJson(response.data!);
  }

  /// Elimina una nota (`DELETE /api/notas/{id}`).
  Future<void> eliminar(int id) async {
    await apiClient.dio.delete<void>('/notas/$id');
  }

  /// Lee el orden preferido de notas desde `/api/preferencias`.
  Future<OrdenNotas> obtenerOrdenNotas() async {
    try {
      final response = await apiClient.dio.get<Map<String, dynamic>>(
        '/preferencias',
      );
      return OrdenNotas.desdeApi(response.data?['ordenNotas'] as String?);
    } catch (_) {
      return OrdenNotas.nombre;
    }
  }

  /// Guarda el orden preferido de notas en `/api/preferencias`.
  Future<void> guardarOrdenNotas(OrdenNotas orden) async {
    try {
      await apiClient.dio.put<Map<String, dynamic>>(
        '/preferencias',
        data: <String, dynamic>{'ordenNotas': orden.valorApi},
      );
    } catch (_) {
      // Preferencia de interfaz: no bloquea si falla la red.
    }
  }
}
