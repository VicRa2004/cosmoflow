import '../../../core/api/api_client.dart';

/// Comentario de una tarea (`ComentarioTareaDto` en `schema.gen.ts`).
class ComentarioTareaDto {
  const ComentarioTareaDto({
    required this.id,
    required this.tareaId,
    required this.autorId,
    required this.autorNombre,
    required this.contenido,
    required this.createdAt,
    this.autorAvatarUrl,
    this.padreId,
    this.editadoEn,
  });

  final int id;
  final int tareaId;
  final int autorId;
  final String autorNombre;
  final String? autorAvatarUrl;
  final int? padreId;
  final String contenido;
  final String createdAt;
  final String? editadoEn;

  factory ComentarioTareaDto.fromJson(Map<String, dynamic> json) {
    return ComentarioTareaDto(
      id: (json['id'] as num).toInt(),
      tareaId: (json['tareaId'] as num).toInt(),
      autorId: (json['autorId'] as num).toInt(),
      autorNombre: json['autorNombre'] as String? ?? 'Usuario',
      autorAvatarUrl: json['autorAvatarUrl'] as String?,
      padreId: (json['padreId'] as num?)?.toInt(),
      contenido: json['contenido'] as String? ?? '',
      createdAt: json['createdAt'] as String? ?? '',
      editadoEn: json['editadoEn'] as String?,
    );
  }
}

/// Página de comentarios (`GET /api/tareas/{id}/comentarios`).
class PaginaComentarios {
  const PaginaComentarios({
    required this.datos,
    required this.pagina,
    required this.totalElementos,
    required this.totalPaginas,
  });

  final List<ComentarioTareaDto> datos;
  final int pagina;
  final int totalElementos;
  final int totalPaginas;

  factory PaginaComentarios.fromJson(Map<String, dynamic> json) {
    final raw = json['datos'];
    final lista = raw is List
        ? raw
              .whereType<Map<String, dynamic>>()
              .map(ComentarioTareaDto.fromJson)
              .toList(growable: false)
        : const <ComentarioTareaDto>[];
    return PaginaComentarios(
      datos: lista,
      pagina: (json['pagina'] as num?)?.toInt() ?? 1,
      totalElementos: (json['totalElementos'] as num?)?.toInt() ?? lista.length,
      totalPaginas: (json['totalPaginas'] as num?)?.toInt() ?? 1,
    );
  }
}

/// Agrupa la lista plana en comentarios raíz y sus respuestas (hilos de 1 nivel).
({
  List<ComentarioTareaDto> raices,
  Map<int, List<ComentarioTareaDto>> respuestasPorPadre,
})
agruparHilosComentarios(List<ComentarioTareaDto> comentarios) {
  final ids = comentarios.map((c) => c.id).toSet();
  final raices = <ComentarioTareaDto>[];
  final respuestas = <int, List<ComentarioTareaDto>>{};
  for (final c in comentarios) {
    final padreId = c.padreId;
    if (padreId != null && ids.contains(padreId)) {
      respuestas.putIfAbsent(padreId, () => <ComentarioTareaDto>[]).add(c);
    } else {
      raices.add(c);
    }
  }
  return (raices: raices, respuestasPorPadre: respuestas);
}

/// Detecta si el cursor está escribiendo una mención `@texto` al final de [textoAntesCursor].
/// Devuelve el fragmento de búsqueda tras `@` (o `null` si no hay mención activa).
String? consultaMencionActiva(String textoAntesCursor) {
  final match = RegExp(r'(?:^|\s)@([^\s@\[\]]*)$').firstMatch(textoAntesCursor);
  return match?.group(1);
}

/// Reemplaza `@consulta` al final de [texto] por el formato Markdown `[@Nombre](mencion:ID) `.
String insertarMencionEnTexto(
  String texto, {
  required int id,
  required String nombre,
}) {
  final reemplazo = '[@$nombre](mencion:$id) ';
  final match = RegExp(r'(^|\s)@([^\s@\[\]]*)$').firstMatch(texto);
  if (match == null) return '$texto$reemplazo';
  final prefijo = match.group(1) ?? '';
  return '${texto.substring(0, match.start)}$prefijo$reemplazo';
}

/// Cliente de API para `/api/tareas/{id}/comentarios`.
class ComentariosApi {
  const ComentariosApi({required this.apiClient});

  final ApiClient apiClient;

  Future<PaginaComentarios> obtenerTodos(
    int tareaId, {
    int pagina = 1,
    int limite = 50,
  }) async {
    final response = await apiClient.dio.get<Map<String, dynamic>>(
      '/tareas/$tareaId/comentarios',
      queryParameters: <String, dynamic>{'pagina': pagina, 'limite': limite},
    );
    return PaginaComentarios.fromJson(
      response.data ?? const <String, dynamic>{},
    );
  }

  Future<ComentarioTareaDto> crear(
    int tareaId, {
    required String contenido,
    int? padreId,
  }) async {
    final response = await apiClient.dio.post<Map<String, dynamic>>(
      '/tareas/$tareaId/comentarios',
      data: <String, dynamic>{
        'contenido': contenido.trim(),
        'padreId': ?padreId,
      },
    );
    return ComentarioTareaDto.fromJson(response.data!);
  }

  Future<ComentarioTareaDto> actualizar(
    int tareaId,
    int comentarioId, {
    required String contenido,
  }) async {
    final response = await apiClient.dio.put<Map<String, dynamic>>(
      '/tareas/$tareaId/comentarios/$comentarioId',
      data: <String, dynamic>{'contenido': contenido.trim()},
    );
    return ComentarioTareaDto.fromJson(response.data!);
  }

  Future<void> eliminar(int tareaId, int comentarioId) async {
    await apiClient.dio.delete<void>(
      '/tareas/$tareaId/comentarios/$comentarioId',
    );
  }
}
