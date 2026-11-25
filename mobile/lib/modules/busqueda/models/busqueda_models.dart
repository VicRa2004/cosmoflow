/// Resultado con título (tareas y notas) de `GET /api/busqueda`.
class ResultadoTituloDto {
  const ResultadoTituloDto({required this.id, required this.titulo});

  final int id;
  final String titulo;

  factory ResultadoTituloDto.fromJson(Map<String, dynamic> json) {
    return ResultadoTituloDto(
      id: (json['id'] as num).toInt(),
      titulo: json['titulo'] as String? ?? '',
    );
  }
}

/// Resultado de proyecto o equipo (pertenece a una organización).
class ResultadoOrganizacionDto {
  const ResultadoOrganizacionDto({
    required this.id,
    required this.nombre,
    required this.organizacionId,
  });

  final int id;
  final String nombre;
  final int organizacionId;

  factory ResultadoOrganizacionDto.fromJson(Map<String, dynamic> json) {
    return ResultadoOrganizacionDto(
      id: (json['id'] as num).toInt(),
      nombre: json['nombre'] as String? ?? '',
      organizacionId: (json['organizacionId'] as num).toInt(),
    );
  }
}

/// Respuesta completa de `GET /api/busqueda?q=`.
class ResultadosBusquedaDto {
  const ResultadosBusquedaDto({
    this.tareas = const <ResultadoTituloDto>[],
    this.notas = const <ResultadoTituloDto>[],
    this.proyectos = const <ResultadoOrganizacionDto>[],
    this.equipos = const <ResultadoOrganizacionDto>[],
  });

  final List<ResultadoTituloDto> tareas;
  final List<ResultadoTituloDto> notas;
  final List<ResultadoOrganizacionDto> proyectos;
  final List<ResultadoOrganizacionDto> equipos;

  bool get isEmpty =>
      tareas.isEmpty && notas.isEmpty && proyectos.isEmpty && equipos.isEmpty;

  int get total =>
      tareas.length + notas.length + proyectos.length + equipos.length;

  factory ResultadosBusquedaDto.fromJson(Map<String, dynamic> json) {
    List<T> parsear<T>(
      dynamic raw,
      T Function(Map<String, dynamic>) constructor,
    ) {
      if (raw is! List) return const <Never>[];
      return raw
          .whereType<Map<String, dynamic>>()
          .map(constructor)
          .toList(growable: false);
    }

    return ResultadosBusquedaDto(
      tareas: parsear(json['tareas'], ResultadoTituloDto.fromJson),
      notas: parsear(json['notas'], ResultadoTituloDto.fromJson),
      proyectos: parsear(json['proyectos'], ResultadoOrganizacionDto.fromJson),
      equipos: parsear(json['equipos'], ResultadoOrganizacionDto.fromJson),
    );
  }
}
