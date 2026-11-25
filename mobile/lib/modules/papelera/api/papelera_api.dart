import '../../../core/api/api_client.dart';

/// Tipo de recurso listado en la papelera.
enum TipoPapelera {
  tareas('tareas', 'Tareas', 'tarea'),
  notas('notas', 'Notas', 'nota');

  const TipoPapelera(this.segmento, this.titulo, this.singular);
  final String segmento;
  final String titulo;
  final String singular;
}

/// Elemento borrado (tarea o nota) en la papelera.
class ElementoPapeleraDto {
  const ElementoPapeleraDto({required this.id, required this.titulo});

  final int id;
  final String titulo;

  factory ElementoPapeleraDto.fromJson(Map<String, dynamic> json) {
    return ElementoPapeleraDto(
      id: (json['id'] as num).toInt(),
      titulo: json['titulo'] as String? ?? '',
    );
  }
}

/// Página de elementos en la papelera (`GET /api/{tareas|notas}/papelera`).
class PaginaPapelera {
  const PaginaPapelera({
    required this.datos,
    required this.pagina,
    required this.totalPaginas,
    required this.totalElementos,
  });

  final List<ElementoPapeleraDto> datos;
  final int pagina;
  final int totalPaginas;
  final int totalElementos;

  factory PaginaPapelera.fromJson(Map<String, dynamic> json) {
    final raw = json['datos'];
    final lista = raw is List
        ? raw
              .whereType<Map<String, dynamic>>()
              .map(ElementoPapeleraDto.fromJson)
              .toList(growable: false)
        : const <ElementoPapeleraDto>[];
    return PaginaPapelera(
      datos: lista,
      pagina: (json['pagina'] as num?)?.toInt() ?? 1,
      totalPaginas: (json['totalPaginas'] as num?)?.toInt() ?? 1,
      totalElementos: (json['totalElementos'] as num?)?.toInt() ?? lista.length,
    );
  }
}

/// Cliente de API para la papelera de tareas y notas.
class PapeleraApi {
  const PapeleraApi({required this.apiClient});

  final ApiClient apiClient;

  /// Lista elementos borrados (`GET /api/{tareas|notas}/papelera`).
  Future<PaginaPapelera> obtener(
    TipoPapelera tipo, {
    int pagina = 1,
    int limite = 25,
  }) async {
    final response = await apiClient.dio.get<Map<String, dynamic>>(
      '/${tipo.segmento}/papelera',
      queryParameters: <String, dynamic>{'pagina': pagina, 'limite': limite},
    );
    return PaginaPapelera.fromJson(response.data ?? const <String, dynamic>{});
  }

  /// Restaura un elemento borrado (`POST /api/{tareas|notas}/papelera/{id}/restaurar`).
  Future<void> restaurar(TipoPapelera tipo, int id) async {
    await apiClient.dio.post<void>('/${tipo.segmento}/papelera/$id/restaurar');
  }

  /// Elimina definitivamente un elemento (`DELETE /api/{tareas|notas}/papelera/{id}`).
  Future<void> eliminarDefinitivo(TipoPapelera tipo, int id) async {
    await apiClient.dio.delete<void>('/${tipo.segmento}/papelera/$id');
  }
}
