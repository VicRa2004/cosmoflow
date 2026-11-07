/// DTO de Tag (`TagDto` en `schema.gen.ts`).
class TagDto {
  const TagDto({
    required this.id,
    required this.nombre,
    this.color,
  });

  final int id;
  final String nombre;
  final String? color;

  factory TagDto.fromJson(Map<String, dynamic> json) {
    return TagDto(
      id: (json['id'] as num).toInt(),
      nombre: json['nombre'] as String? ?? '',
      color: json['color'] as String?,
    );
  }
}

/// Respuesta paginada de `GET /api/tags`.
class PaginaTags {
  const PaginaTags({
    required this.datos,
    required this.pagina,
    required this.totalPaginas,
    required this.totalElementos,
  });

  final List<TagDto> datos;
  final int pagina;
  final int totalPaginas;
  final int totalElementos;

  factory PaginaTags.fromJson(Map<String, dynamic> json) {
    final datosRaw = json['datos'];
    final lista = datosRaw is List
        ? datosRaw
            .whereType<Map<String, dynamic>>()
            .map(TagDto.fromJson)
            .toList(growable: false)
        : const <TagDto>[];

    return PaginaTags(
      datos: lista,
      pagina: (json['pagina'] as num?)?.toInt() ?? 1,
      totalPaginas: (json['totalPaginas'] as num?)?.toInt() ?? 1,
      totalElementos: (json['totalElementos'] as num?)?.toInt() ?? lista.length,
    );
  }
}
