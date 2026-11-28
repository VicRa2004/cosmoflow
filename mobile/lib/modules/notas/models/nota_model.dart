import 'carpeta_model.dart';

/// DTO de Nota (`NotaDto` en `schema.gen.ts`).
class NotaDto {
  const NotaDto({
    required this.id,
    required this.titulo,
    required this.contenido,
    this.color,
    this.isFijada = false,
    this.tagIds = const <int>[],
    this.proyectoId,
    this.carpetaId,
    this.createdAt,
    this.updatedAt,
  });

  final int id;
  final String titulo;
  final String contenido;
  final String? color;
  final bool isFijada;
  final List<int> tagIds;
  final int? proyectoId;
  final int? carpetaId;
  final DateTime? createdAt;
  final DateTime? updatedAt;

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
      isFijada: json['isFijada'] as bool? ?? false,
      tagIds: listaTags,
      proyectoId: (json['proyectoId'] as num?)?.toInt(),
      carpetaId: (json['carpetaId'] as num?)?.toInt(),
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? ''),
      updatedAt: DateTime.tryParse(json['updatedAt'] as String? ?? ''),
    );
  }
}

/// Ordena notas poniendo siempre las fijadas arriba y el resto según [orden].
List<NotaDto> ordenarNotas(List<NotaDto> lista, OrdenNotas orden) {
  final copia = List<NotaDto>.from(lista);
  copia.sort((a, b) {
    if (a.isFijada != b.isFijada) return a.isFijada ? -1 : 1;
    return switch (orden) {
      OrdenNotas.nombre => a.titulo.toLowerCase().compareTo(
        b.titulo.toLowerCase(),
      ),
      OrdenNotas.creada => (b.createdAt ?? DateTime(0)).compareTo(
        a.createdAt ?? DateTime(0),
      ),
      OrdenNotas.modificada => (b.updatedAt ?? DateTime(0)).compareTo(
        a.updatedAt ?? DateTime(0),
      ),
    };
  });
  return copia;
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
