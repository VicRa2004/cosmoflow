/// DTO de carpeta de notas (`CarpetaDto` en `schema.gen.ts`).
class CarpetaDto {
  const CarpetaDto({
    required this.id,
    required this.nombre,
    this.icono,
    this.color,
    this.padreId,
  });

  final int id;
  final String nombre;

  /// Emoji; sin él se muestra 📁.
  final String? icono;
  final String? color;
  final int? padreId;

  factory CarpetaDto.fromJson(Map<String, dynamic> json) => CarpetaDto(
    id: (json['id'] as num).toInt(),
    nombre: json['nombre'] as String? ?? '',
    icono: json['icono'] as String?,
    color: json['color'] as String?,
    padreId: (json['padreId'] as num?)?.toInt(),
  );
}

/// Recorrido en profundidad con su nivel, para listarlas con sangría.
List<({CarpetaDto carpeta, int nivel})> carpetasEnArbol(
  List<CarpetaDto> carpetas,
) {
  final salida = <({CarpetaDto carpeta, int nivel})>[];
  void visitar(int? padreId, int nivel) {
    for (final c in carpetas.where((c) => c.padreId == padreId)) {
      salida.add((carpeta: c, nivel: nivel));
      if (nivel < 50) visitar(c.id, nivel + 1);
    }
  }

  visitar(null, 0);
  return salida;
}
