/// Orden de carpetas y notas en el explorador (`ordenNotas` en `/api/preferencias`).
enum OrdenNotas {
  nombre('nombre', 'Nombre'),
  creada('creada', 'Fecha de creación'),
  modificada('modificada', 'Última modificación');

  const OrdenNotas(this.valorApi, this.etiqueta);

  final String valorApi;
  final String etiqueta;

  static OrdenNotas desdeApi(String? valor) => OrdenNotas.values.firstWhere(
    (o) => o.valorApi == valor,
    orElse: () => OrdenNotas.nombre,
  );
}

/// DTO de carpeta de notas (`CarpetaDto` en `schema.gen.ts`).
class CarpetaDto {
  const CarpetaDto({
    required this.id,
    required this.nombre,
    this.icono,
    this.color,
    this.padreId,
    this.createdAt,
    this.updatedAt,
  });

  final int id;
  final String nombre;

  /// Emoji o identificador; sin él se muestra icono de carpeta.
  final String? icono;
  final String? color;
  final int? padreId;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  factory CarpetaDto.fromJson(Map<String, dynamic> json) => CarpetaDto(
    id: (json['id'] as num).toInt(),
    nombre: json['nombre'] as String? ?? '',
    icono: json['icono'] as String?,
    color: json['color'] as String?,
    padreId: (json['padreId'] as num?)?.toInt(),
    createdAt: DateTime.tryParse(json['createdAt'] as String? ?? ''),
    updatedAt: DateTime.tryParse(json['updatedAt'] as String? ?? ''),
  );
}

/// Recorrido en profundidad con su nivel, para listarlas con sangría.
List<({CarpetaDto carpeta, int nivel})> carpetasEnArbol(
  List<CarpetaDto> carpetas, {
  Set<int> excluirIds = const <int>{},
}) {
  final salida = <({CarpetaDto carpeta, int nivel})>[];
  void visitar(int? padreId, int nivel) {
    for (final c in carpetas.where(
      (c) => c.padreId == padreId && !excluirIds.contains(c.id),
    )) {
      salida.add((carpeta: c, nivel: nivel));
      if (nivel < 50) visitar(c.id, nivel + 1);
    }
  }

  visitar(null, 0);
  return salida;
}

/// Devuelve la cadena de carpetas desde la raíz hasta [carpetaId] (para migas).
List<CarpetaDto> rutaDeCarpeta(int? carpetaId, List<CarpetaDto> carpetas) {
  if (carpetaId == null) return const <CarpetaDto>[];
  final porId = <int, CarpetaDto>{for (final c in carpetas) c.id: c};
  final ruta = <CarpetaDto>[];
  final visitados = <int>{};
  var actual = porId[carpetaId];
  while (actual != null && visitados.add(actual.id)) {
    ruta.add(actual);
    actual = actual.padreId == null ? null : porId[actual.padreId!];
  }
  return ruta.reversed.toList(growable: false);
}

/// Conjunto de [carpetaId] y todos sus descendientes (evita ciclos al mover).
Set<int> descendientesDeCarpeta(int carpetaId, List<CarpetaDto> carpetas) {
  final resultado = <int>{carpetaId};
  var agregado = true;
  while (agregado) {
    agregado = false;
    for (final c in carpetas) {
      if (c.padreId != null &&
          resultado.contains(c.padreId) &&
          resultado.add(c.id)) {
        agregado = true;
      }
    }
  }
  return resultado;
}

/// Ordena carpetas según [orden] (fechas descendentes, nombre alfabético).
List<CarpetaDto> ordenarCarpetas(List<CarpetaDto> lista, OrdenNotas orden) {
  final copia = List<CarpetaDto>.from(lista);
  copia.sort((a, b) {
    return switch (orden) {
      OrdenNotas.nombre => a.nombre.toLowerCase().compareTo(
        b.nombre.toLowerCase(),
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
