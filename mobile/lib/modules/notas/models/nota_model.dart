/// DTO de Nota (`NotaDto` en `schema.gen.ts`).
class NotaDto {
  const NotaDto({
    required this.id,
    required this.titulo,
    required this.contenido,
    this.color,
    this.tagIds = const <int>[],
    this.proyectoId,
    this.carpetaId,
  });

  final int id;
  final String titulo;
  final String contenido;
  final String? color;
  final List<int> tagIds;
  final int? proyectoId;
  final int? carpetaId;

  factory NotaDto.fromJson(Map<String, dynamic> json) {
    final tagIdsRaw = json['tagIds'];
    final listaTags = tagIdsRaw is List
        ? tagIdsRaw.whereType<num>().map((e) => e.toInt()).toList()
        : const <int>[];

    return NotaDto(
      id: (json['id'] as num).toInt(),
      titulo: json['titulo'] as String? ?? '',
      contenido: json['contenido'] as String? ?? '',
      color: json['color'] as String?,
      tagIds: listaTags,
      proyectoId: (json['proyectoId'] as num?)?.toInt(),
      carpetaId: (json['carpetaId'] as num?)?.toInt(),
    );
  }
}

/// Respuesta paginada de `GET /api/notas`.
class PaginaNotas {
  const PaginaNotas({
    required this.datos,
    required this.pagina,
    required this.totalPaginas,
    required this.totalElementos,
  });

  final List<NotaDto> datos;
  final int pagina;
  final int totalPaginas;
  final int totalElementos;

  factory PaginaNotas.fromJson(Map<String, dynamic> json) {
    final datosRaw = json['datos'];
    final lista = datosRaw is List
        ? datosRaw
              .whereType<Map<String, dynamic>>()
              .map(NotaDto.fromJson)
              .toList(growable: false)
        : const <NotaDto>[];

    return PaginaNotas(
      datos: lista,
      pagina: (json['pagina'] as num?)?.toInt() ?? 1,
      totalPaginas: (json['totalPaginas'] as num?)?.toInt() ?? 1,
      totalElementos: (json['totalElementos'] as num?)?.toInt() ?? lista.length,
    );
  }
}
